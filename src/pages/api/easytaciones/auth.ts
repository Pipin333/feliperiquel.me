import type { APIRoute } from 'astro';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

/**
 * Valida si un token coincide con la clave configurada en el entorno.
 */
function isValidToken(providedToken: string | null | undefined): boolean {
  const secret = process.env.EASYTACIONES_ACCESS_TOKEN || 'felipe_easytaciones_2026_key';
  if (!providedToken) return false;
  return providedToken.trim() === secret.trim();
}

/**
 * Extrae el token de la cookie 'easytaciones_session' o de la cabecera 'Authorization'.
 */
function extractToken(request: Request): string | null {
  // 1. Cabecera Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie easytaciones_session
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...v] = c.trim().split('=');
        return [key, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies['easytaciones_session']) {
      return cookies['easytaciones_session'];
    }
  }

  return null;
}

/**
 * GET /api/easytaciones/auth
 * Verifica si el usuario actual posee una sesión válida.
 */
export const GET: APIRoute = async ({ request }) => {
  const token = extractToken(request);
  const authenticated = isValidToken(token);

  return new Response(
    JSON.stringify({
      authenticated,
      status: authenticated ? 'authorized' : 'unauthorized'
    }),
    {
      status: authenticated ? 200 : 401,
      headers: NO_INDEX_HEADERS
    }
  );
};

/**
 * POST /api/easytaciones/auth
 * Inicia sesión verificando el token provisto y creando la cookie HttpOnly.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!isValidToken(token)) {
      return new Response(
        JSON.stringify({
          success: false,
          authenticated: false,
          error: 'Credencial inválida. Token de acceso no coincide.'
        }),
        {
          status: 401,
          headers: NO_INDEX_HEADERS
        }
      );
    }

    // Cookie segura de sesión (HttpOnly, SameSite=Lax, 7 días de duración)
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    const cookieValue = `easytaciones_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${secureFlag}`;

    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        message: 'Sesión iniciada con éxito.'
      }),
      {
        status: 200,
        headers: {
          ...NO_INDEX_HEADERS,
          'Set-Cookie': cookieValue
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al procesar autenticación';
    return new Response(
      JSON.stringify({ success: false, authenticated: false, error: message }),
      {
        status: 500,
        headers: NO_INDEX_HEADERS
      }
    );
  }
};

/**
 * DELETE /api/easytaciones/auth
 * Cierra la sesión eliminando la cookie HttpOnly.
 */
export const DELETE: APIRoute = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  const clearCookie = `easytaciones_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`;

  return new Response(
    JSON.stringify({
      success: true,
      authenticated: false,
      message: 'Sesión cerrada correctamente.'
    }),
    {
      status: 200,
      headers: {
        ...NO_INDEX_HEADERS,
        'Set-Cookie': clearCookie
      }
    }
  );
};
