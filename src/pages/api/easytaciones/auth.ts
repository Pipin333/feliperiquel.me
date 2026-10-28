import type { APIRoute } from 'astro';
import { createDecipheriv, createHash, scryptSync, timingSafeEqual } from 'node:crypto';

export const prerender = false;

const NO_INDEX_HEADERS = {
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store, private'
};

// Hash SHA-256 de la llave de acceso (sin exponer texto plano en código)
const DEFAULT_TOKEN_SHA256 = '6a88c17a68ac1a5e1ed25f52f11ff80a0ec72ecabdce06767b9c11a66d33e88a';

// Bóveda cifrada con AES-256-GCM (Key derivada vía scrypt desde la llave de acceso)
const VAULT_SALT = 'easytaciones_vault_v1_salt';
const ENCRYPTED_DEFAULT_PROFILE =
  'qKDKYOrM+Eq20BoB.4i7Psg2hhVaetWZ4WZe2/g==.' +
  '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';

/**
 * Compara dos hashes hexadecimales en tiempo constante para prevenir ataques de timing.
 */
function safeCompareHex(hexA: string, hexB: string): boolean {
  if (hexA.length !== hexB.length) return false;
  try {
    return timingSafeEqual(Buffer.from(hexA, 'hex'), Buffer.from(hexB, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Valida si un token coincide con la clave configurada en el entorno o con el hash maestro.
 */
export function isValidToken(providedToken: string | null | undefined): boolean {
  if (!providedToken) return false;
  const candidate = providedToken.trim();
  if (!candidate) return false;

  const candidateHash = createHash('sha256').update(candidate).digest('hex');

  const envSecret = process.env.EASYTACIONES_ACCESS_TOKEN?.trim();
  if (envSecret && envSecret !== 'felipe_easytaciones_2026_key') {
    const envHash = createHash('sha256').update(envSecret).digest('hex');
    if (safeCompareHex(candidateHash, envHash)) return true;
  }

  return safeCompareHex(candidateHash, DEFAULT_TOKEN_SHA256);
}

/**
 * Desencripta en memoria el perfil por defecto usando el token validado del usuario.
 */
export function decryptDefaultProfile<T = Record<string, unknown>>(token: string | null | undefined): T | null {
  if (!token) return null;
  const candidate = token.trim();
  if (!candidate) return null;

  try {
    const parts = ENCRYPTED_DEFAULT_PROFILE.split('.');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const key = scryptSync(candidate, VAULT_SALT, 32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Extrae el token de la cookie 'easytaciones_session' o de la cabecera 'Authorization'.
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

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
 * Valida si una solicitud HTTP cuenta con sesión o token válido de Easytaciones.
 */
export function isAuthorized(request: Request): boolean {
  return isValidToken(extractToken(request));
}

/**
 * GET /api/easytaciones/auth
 * Verifica si el usuario actual posee una sesión válida y devuelve el perfil desencriptado.
 */
export const GET: APIRoute = async ({ request }) => {
  const token = extractToken(request);
  const authenticated = isValidToken(token);
  const defaultProfile = authenticated ? decryptDefaultProfile(token) : null;

  return new Response(
    JSON.stringify({
      authenticated,
      status: authenticated ? 'authorized' : 'unauthorized',
      ...(defaultProfile ? { defaultProfile } : {})
    }),
    {
      status: authenticated ? 200 : 401,
      headers: NO_INDEX_HEADERS
    }
  );
};

/**
 * POST /api/easytaciones/auth
 * Inicia sesión verificando el token provisto, desencripta el perfil y crea la cookie HttpOnly.
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

    const defaultProfile = decryptDefaultProfile(token);

    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    const cookieValue = `easytaciones_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${secureFlag}`;

    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        message: 'Sesión iniciada con éxito.',
        ...(defaultProfile ? { defaultProfile } : {})
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
