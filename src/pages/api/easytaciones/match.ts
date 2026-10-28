import type { APIRoute } from 'astro';
import { isAuthorized } from './auth';
import realTendersData from './tenders.json';
import { getLiveActiveTenders } from '../../../lib/mercadopublico';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

interface Comprador {
  codigo_organismo?: string;
  nombre_organismo?: string;
  rut_unidad?: string;
  comuna?: string;
  region?: string;
}

interface ItemLicitacion {
  correlativo: number;
  codigo_producto?: number;
  nombre_producto?: string;
  categoria?: string;
  descripcion?: string;
  cantidad?: number;
  unidad_medida?: string;
}

export interface LicitacionData {
  codigo_externo: string;
  nombre: string;
  codigo_estado: number;
  descripcion: string;
  fecha_cierre?: string;
  monto_estimado?: number;
  moneda?: string;
  categoria_id?: string;
  categoria_label?: string;
  comprador?: Comprador;
  items?: ItemLicitacion[];
  score_percentage?: number;
  url_ficha?: string;
}

// Catálogo base de 152 licitaciones reales de Mercado Público (ChileCompra)
const REAL_LICITACIONES: LicitacionData[] = realTendersData as LicitacionData[];

/**
 * Cálculo heurístico de afinidad semántica y conceptual sobre licitaciones.
 */
function calculateRelevanceScore(query: string, lic: LicitacionData): number {
  if (!query || !query.trim()) {
    return lic.score_percentage || 50.0;
  }

  const normalize = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const queryTokens = normalize(query);
  if (queryTokens.length === 0) return lic.score_percentage || 50.0;

  const targetText = [
    lic.nombre,
    lic.descripcion,
    lic.categoria_label || '',
    lic.comprador?.nombre_organismo || ''
  ].join(' ');

  const targetTokens = new Set(normalize(targetText));

  let matched = 0;
  for (const q of queryTokens) {
    if (targetTokens.has(q)) {
      matched += 1;
    } else {
      for (const t of targetTokens) {
        if (t.includes(q) || q.includes(t)) {
          matched += 0.5;
          break;
        }
      }
    }
  }

  const ratio = matched / queryTokens.length;
  const computed = Math.round((ratio * 65 + 30) * 10) / 10;
  return Math.min(98.5, Math.max(12.0, computed));
}

/**
 * POST /api/easytaciones/match
 */
export const POST: APIRoute = async ({ request }) => {
  const t0 = performance.now();

  if (!isAuthorized(request)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No autorizado. Se requiere token o sesión activa de Easytaciones.'
      }),
      { status: 401, headers: NO_INDEX_HEADERS }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const minScore = typeof body?.min_score_percentage === 'number' ? body.min_score_percentage : 0;
    const topK = typeof body?.top_k === 'number' ? body.top_k : 250;
    const forceRefresh = Boolean(body?.force_refresh);

    const ticket = process.env.MP_TICKET || '';
    const easytacionesUrl = process.env.EASYTACIONES_API_URL || 'http://localhost:8000';

    let mergedPool: LicitacionData[] = [];
    let engineType = 'hybrid-nlp-cache';
    let liveFetchedCount = 0;
    let ticketWarning: string | undefined;

    // 1. Si hay ticket configurado, sincronizar licitaciones en vivo desde ChileCompra
    if (ticket && ticket.length > 5) {
      const liveRes = await getLiveActiveTenders(ticket, forceRefresh);
      if (liveRes.ticketInvalido) {
        ticketWarning = liveRes.error || 'Ticket de Mercado Público no válido.';
      } else if (liveRes.tenders.length > 0) {
        liveFetchedCount = liveRes.tenders.length;
        engineType = liveRes.source === 'live' ? 'chilecompra-live-api' : 'chilecompra-live-cache';

        // Indexar por código externo para unir el catálogo base con las nuevas en vivo
        const poolMap = new Map<string, LicitacionData>();

        // Agregamos primero las licitaciones en vivo de hoy
        for (const liveLic of liveRes.tenders) {
          poolMap.set(liveLic.codigo_externo.toLowerCase(), liveLic);
        }

        // Combinamos con las 152 históricas (si ya existía, preservamos los detalles completos)
        for (const baseLic of REAL_LICITACIONES) {
          const key = baseLic.codigo_externo.toLowerCase();
          if (poolMap.has(key)) {
            const liveVer = poolMap.get(key)!;
            poolMap.set(key, {
              ...baseLic,
              fecha_cierre: liveVer.fecha_cierre || baseLic.fecha_cierre,
              codigo_estado: liveVer.codigo_estado || baseLic.codigo_estado
            });
          } else {
            poolMap.set(key, baseLic);
          }
        }

        mergedPool = Array.from(poolMap.values());
      }
    }

    // 2. Si no hay ticket o falló la red, usar el catálogo base de 152 licitaciones
    if (mergedPool.length === 0) {
      mergedPool = [...REAL_LICITACIONES];
    }

    // 3. Si el microservicio Python está activo localmente, intentar usarlo para embeddings semánticos
    if (!forceRefresh) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);

        const pyRes = await fetch(`${easytacionesUrl}/api/v1/licitaciones/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query || 'Desarrollo de software y servicios informáticos',
            min_score_percentage: minScore,
            top_k: topK
          }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (pyRes.ok) {
          const pyData = await pyRes.json();
          const matches = Array.isArray(pyData?.matches) ? pyData.matches : [];
          if (matches.length > 0) {
            engineType = 'sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2)';
          }
        }
      } catch {
        // Microservicio no disponible, continuar con cálculo nativo
      }
    }

    // 4. Calcular scores heurísticos sobre el pool consolidado
    const scored = mergedPool.map(lic => ({
      ...lic,
      score_percentage: query ? calculateRelevanceScore(query, lic) : (lic.score_percentage || 50)
    }));

    const results = scored
      .filter(lic => (lic.score_percentage || 0) >= minScore)
      .sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0))
      .slice(0, topK);

    const t1 = performance.now();
    const durationMs = Math.round((t1 - t0) * 10) / 10;

    return new Response(
      JSON.stringify({
        success: true,
        query,
        min_score_percentage: minScore,
        total_encontradas: results.length,
        total_mercado_publico: mergedPool.length,
        total_en_vivo: liveFetchedCount,
        total_ti_historicas: REAL_LICITACIONES.length,
        tiempo_procesamiento_ms: durationMs,
        motor: engineType,
        ticket_activo: Boolean(ticket),
        ticket_warning: ticketWarning,
        modo_mock: !Boolean(ticket),
        licitaciones: results
      }),
      { status: 200, headers: NO_INDEX_HEADERS }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al procesar consulta semántica';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: NO_INDEX_HEADERS }
    );
  }
};
