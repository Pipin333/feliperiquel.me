import type { APIRoute } from 'astro';
import { isAuthorized } from './auth';
import realTendersData from './tenders.json';
import type { LicitacionData } from './match';
import { fetchLiveTenderDetail } from '../../../lib/mercadopublico';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

const REAL_LICITACIONES: LicitacionData[] = realTendersData as LicitacionData[];

export const GET: APIRoute = async ({ request, url }) => {
  if (!isAuthorized(request)) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: NO_INDEX_HEADERS }
    );
  }

  const codigo = url.searchParams.get('codigo')?.trim();
  if (!codigo) {
    return new Response(
      JSON.stringify({ success: false, error: 'Parámetro codigo es requerido' }),
      { status: 400, headers: NO_INDEX_HEADERS }
    );
  }

  // 1. Buscar en el catálogo de 152 licitaciones reales
  const found = REAL_LICITACIONES.find(
    lic => lic.codigo_externo.toLowerCase() === codigo.toLowerCase()
  );

  if (found) {
    return new Response(
      JSON.stringify({ success: true, licitacion: found, origen: 'catalogo-base' }),
      { status: 200, headers: NO_INDEX_HEADERS }
    );
  }

  // 2. Si hay ticket de Mercado Público, consultar en vivo a ChileCompra
  const ticket = process.env.MP_TICKET || '';
  if (ticket && ticket.length > 5) {
    const liveDetail = await fetchLiveTenderDetail(ticket, codigo);
    if (liveDetail) {
      return new Response(
        JSON.stringify({ success: true, licitacion: liveDetail, origen: 'chilecompra-live' }),
        { status: 200, headers: NO_INDEX_HEADERS }
      );
    }
  }

  // 3. Intentar consultar microservicio Python
  const easytacionesUrl = process.env.EASYTACIONES_API_URL || 'http://localhost:8000';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const pyRes = await fetch(`${easytacionesUrl}/api/v1/licitaciones/${encodeURIComponent(codigo)}`, {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (pyRes.ok) {
      const data = await pyRes.json();
      return new Response(
        JSON.stringify({ success: true, licitacion: data, origen: 'python-microservice' }),
        { status: 200, headers: NO_INDEX_HEADERS }
      );
    }
  } catch {}

  // 4. Fallback no encontrada
  return new Response(
    JSON.stringify({
      success: false,
      error: `Licitación '${codigo}' no encontrada en el catálogo activo ni en Mercado Público.`
    }),
    { status: 404, headers: NO_INDEX_HEADERS }
  );
};
