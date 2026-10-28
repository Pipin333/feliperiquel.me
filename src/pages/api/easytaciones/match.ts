import type { APIRoute } from 'astro';
import { isAuthorized } from './auth';
import realTendersData from './tenders.json';

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

// Catálogo de 152 licitaciones reales de Mercado Público (ChileCompra)
const REAL_LICITACIONES: LicitacionData[] = realTendersData as LicitacionData[];

/**
 * Cálculo heurístico de afinidad semántica y conceptual sobre licitaciones reales.
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

  // Base proporcional más peso por categoría
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

    const easytacionesUrl = process.env.EASYTACIONES_API_URL || 'http://localhost:8000';
    let results: LicitacionData[] = [];
    let engineType = 'transformer-microservice';

    // 1. Intentar consultar el microservicio Python local si está encendido
    if (!forceRefresh) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

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
            results = matches.map((m: any) => ({
              ...m.licitacion,
              score_percentage: m.score_percentage
            }));
            engineType = 'sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2)';
          }
        }
      } catch {
        engineType = 'hybrid-nlp-cache';
      }
    }

    // 2. Si el microservicio no está activo o no devolvió resultados, usar las 152 licitaciones reales
    if (results.length === 0) {
      engineType = 'hybrid-nlp-cache';

      const scored = REAL_LICITACIONES.map(lic => ({
        ...lic,
        score_percentage: query ? calculateRelevanceScore(query, lic) : (lic.score_percentage || 50)
      }));

      results = scored
        .filter(lic => (lic.score_percentage || 0) >= minScore)
        .sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0))
        .slice(0, topK);
    }

    const t1 = performance.now();
    const durationMs = Math.round((t1 - t0) * 10) / 10;

    return new Response(
      JSON.stringify({
        success: true,
        query,
        min_score_percentage: minScore,
        total_encontradas: results.length,
        total_mercado_publico: 4791,
        total_ti: REAL_LICITACIONES.length,
        tiempo_procesamiento_ms: durationMs,
        motor: engineType,
        modo_mock: false,
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
