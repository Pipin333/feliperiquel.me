import type { APIRoute } from 'astro';
import type { LicitacionData } from './match';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

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

  const easytacionesUrl = process.env.EASYTACIONES_API_URL || 'http://localhost:8000';

  // 1. Intentar con microservicio Python
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
  } catch {
    // Fallback directo
  }

  // 2. Consulta directa a Mercado Público si hay ticket configurado
  const ticket = process.env.MP_TICKET || '';
  if (ticket && ticket.length > 10) {
    try {
      const mpUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${ticket}`;
      const mpRes = await fetch(mpUrl);
      if (mpRes.ok) {
        const data = await mpRes.json();
        const rawList = Array.isArray(data?.Listado) ? data.Listado : [];
        if (rawList.length > 0) {
          const item = rawList[0];
          const licitacion: LicitacionData = {
            codigo_externo: item.CodigoExterno,
            nombre: item.Nombre,
            codigo_estado: item.CodigoEstado,
            descripcion: item.Descripcion,
            fecha_cierre: item.FechaCierre,
            monto_estimado: item.MontoEstimado,
            moneda: item.Moneda,
            comprador: {
              codigo_organismo: item.Comprador?.CodigoOrganismo,
              nombre_organismo: item.Comprador?.NombreOrganismo,
              rut_unidad: item.Comprador?.RutUnidad,
              comuna: item.Comprador?.ComunaUnidad,
              region: item.Comprador?.RegionUnidad
            },
            items: Array.isArray(item.Items?.Listado)
              ? item.Items.Listado.map((it: any, idx: number) => ({
                  correlativo: idx + 1,
                  codigo_producto: it.CodigoProducto,
                  nombre_producto: it.NombreProducto,
                  categoria: it.Categoria,
                  descripcion: it.Descripcion,
                  cantidad: it.Cantidad,
                  unidad_medida: it.UnidadMedida
                }))
              : []
          };
          return new Response(
            JSON.stringify({ success: true, licitacion }),
            { status: 200, headers: NO_INDEX_HEADERS }
          );
        }
      }
    } catch {
      // Ignorar y continuar a mock
    }
  }

  // 3. Respuesta no encontrada o fallback
  return new Response(
    JSON.stringify({
      success: false,
      error: `Licitación '${codigo}' no encontrada en el catálogo activo.`
    }),
    { status: 404, headers: NO_INDEX_HEADERS }
  );
};
