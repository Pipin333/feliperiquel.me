import type { APIRoute } from 'astro';
import realTendersData from './tenders.json';
import type { LicitacionData } from './match';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

const REAL_LICITACIONES: LicitacionData[] = realTendersData as LicitacionData[];

function isAuthorized(request: Request): boolean {
  const secret = process.env.EASYTACIONES_ACCESS_TOKEN || 'felipe_easytaciones_2026_key';

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === secret.trim()) return true;
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies['easytaciones_session'] === secret.trim()) {
      return true;
    }
  }

  return false;
}

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
      JSON.stringify({ success: true, licitacion: found }),
      { status: 200, headers: NO_INDEX_HEADERS }
    );
  }

  // 2. Intentar consultar microservicio Python
  const easytacionesUrl = process.env.EASYTACIONES_API_URL || 'http://localhost:8000';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const pyRes = await fetch(`${easytacionesUrl}/api/v1/licitaciones/${encodeURIComponent(codigo)}`, {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (pyRes.ok) {
      const data = await pyRes.json();
      return new Response(
        JSON.stringify({ success: true, licitacion: data }),
        { status: 200, headers: NO_INDEX_HEADERS }
      );
    }
  } catch {}

  // 3. Fallback no encontrada
  return new Response(
    JSON.stringify({
      success: false,
      error: `Licitación '${codigo}' no encontrada en el catálogo activo.`
    }),
    { status: 404, headers: NO_INDEX_HEADERS }
  );
};
