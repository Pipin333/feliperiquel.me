import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const prerender = false;

interface ContactPayload {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  botcheck?: string;
}

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  lastRequestTime: number;
}

const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB hard limit against oversized payloads

const ContactSchema = z.object({
  name: z
    .string({ required_error: 'Por favor ingresa un nombre valido (2 a 100 caracteres).' })
    .trim()
    .min(2, 'Por favor ingresa un nombre valido (2 a 100 caracteres).')
    .max(100, 'Por favor ingresa un nombre valido (2 a 100 caracteres).'),
  email: z
    .string({ required_error: 'Por favor ingresa un correo electronico valido.' })
    .trim()
    .toLowerCase()
    .max(150, 'Por favor ingresa un correo electronico valido.')
    .email('Por favor ingresa un correo electronico valido.')
    .refine((val) => !/[(),'"\\<>]/.test(val), 'Por favor ingresa un correo electronico valido.'),
  topic: z
    .string({ required_error: 'Por favor indica un asunto o motivo valido.' })
    .trim()
    .min(3, 'Por favor indica un asunto o motivo valido.')
    .max(150, 'Por favor indica un asunto o motivo valido.'),
  message: z
    .string({ required_error: 'El mensaje debe contener entre 10 y 4000 caracteres.' })
    .trim()
    .min(10, 'El mensaje debe contener entre 10 y 4000 caracteres.')
    .max(4000, 'El mensaje debe contener entre 10 y 4000 caracteres.'),
  botcheck: z.string().optional().default('')
});

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// In-Memory Rate Limiting Configuration (Layer 1: Burst & instance protection)
const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MIN_INTERVAL_MS = 4 * 1000; // 4 seconds between requests
const inMemoryStore = new Map<string, RateLimitRecord>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

async function computeSha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + '_feliperiquelme_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function cleanExpiredRateLimitEntries(now: number) {
  if (inMemoryStore.size > 200) {
    for (const [key, record] of inMemoryStore.entries()) {
      if (now - record.firstRequestTime > WINDOW_MS) {
        inMemoryStore.delete(key);
      }
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 0. Guard against oversized payloads before parsing body
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'El tamano de la solicitud excede el limite permitido (16 KB).' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = getClientIp(request);
    const ipHash = await computeSha256(clientIp);
    const now = Date.now();

    // 1. Layer 1: In-Memory Fast Rate Limiter
    cleanExpiredRateLimitEntries(now);
    const memRecord = inMemoryStore.get(ipHash);

    if (memRecord) {
      // Rapid burst block (e.g. rapid double-clicking or scripted bursts)
      if (now - memRecord.lastRequestTime < MIN_INTERVAL_MS) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Peticion demasiado rapida. Por favor espera unos segundos antes de reintentar.'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '5'
            }
          }
        );
      }

      // Sliding window capacity check
      if (now - memRecord.firstRequestTime < WINDOW_MS) {
        if (memRecord.count >= MAX_REQUESTS_PER_WINDOW) {
          const secondsRemaining = Math.max(1, Math.ceil((WINDOW_MS - (now - memRecord.firstRequestTime)) / 1000));
          return new Response(
            JSON.stringify({
              success: false,
              error: `Has alcanzado el limite de mensajes (maximo ${MAX_REQUESTS_PER_WINDOW} cada 10 minutos). Por favor espera ${Math.ceil(secondsRemaining / 60)} minutos o contactame via WhatsApp.`
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': secondsRemaining.toString(),
                'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
                'X-RateLimit-Remaining': '0'
              }
            }
          );
        }
      } else {
        // Reset window
        memRecord.count = 0;
        memRecord.firstRequestTime = now;
      }
    }

    // 2. Parse body safely
    let payload: ContactPayload = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const rawBody = await request.text();
        if (rawBody.length > MAX_PAYLOAD_BYTES) {
          return new Response(
            JSON.stringify({ success: false, error: 'El tamano de la solicitud excede el limite permitido (16 KB).' }),
            { status: 413, headers: { 'Content-Type': 'application/json' } }
          );
        }
        payload = JSON.parse(rawBody);
      } catch (jsonErr) {
        return new Response(
          JSON.stringify({ success: false, error: 'El cuerpo de la solicitud contiene un JSON invalido.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const formData = await request.formData();
      payload = {
        name: formData.get('name')?.toString(),
        email: formData.get('email')?.toString(),
        topic: formData.get('topic')?.toString(),
        message: formData.get('message')?.toString(),
        botcheck: formData.get('botcheck')?.toString()
      };
    }

    // 3. Honeypot check before schema validation
    if (payload.botcheck) {
      return new Response(
        JSON.stringify({ success: true, message: 'Mensaje recibido con exito.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Strict Schema Validation via Zod
    const parsed = ContactSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Datos de formulario invalidos.';
      return new Response(
        JSON.stringify({ success: false, error: firstIssue }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedName = parsed.data.name;
    const sanitizedEmail = parsed.data.email;
    const sanitizedTopic = parsed.data.topic;
    const sanitizedMessage = parsed.data.message;

    const escapedName = escapeHtml(sanitizedName);
    const escapedEmail = escapeHtml(sanitizedEmail);
    const escapedTopic = escapeHtml(sanitizedTopic);
    const escapedMessage = escapeHtml(sanitizedMessage);

    // 5. Environment variables
    const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const notificationEmail = import.meta.env.CONTACT_NOTIFICATION_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL || 'f.riquelmesalvo@uandresbello.edu';

    // 6. Layer 2: Distributed Database Rate Limiter (Supabase / Postgres)
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const windowIsoTime = new Date(now - WINDOW_MS).toISOString();

        const { count, error: countError } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .or(`ip_hash.eq."${ipHash}",email.eq."${sanitizedEmail}"`)
          .gte('created_at', windowIsoTime);

        if (!countError && typeof count === 'number' && count >= MAX_REQUESTS_PER_WINDOW) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Has alcanzado el limite de mensajes recientes (${MAX_REQUESTS_PER_WINDOW} mensajes por ventana). Por favor espera unos minutos o escribeme directamente por WhatsApp.`
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '600',
                'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
                'X-RateLimit-Remaining': '0'
              }
            }
          );
        }
      } catch (rateLimitErr) {
        console.error('[RateLimit Supabase Check Failed]', rateLimitErr);
      }
    }

    // 7. Update In-Memory Rate Limit record upon valid submission
    if (memRecord) {
      memRecord.count++;
      memRecord.lastRequestTime = now;
    } else {
      inMemoryStore.set(ipHash, {
        count: 1,
        firstRequestTime: now,
        lastRequestTime: now
      });
    }

    let dbSaved = false;
    let notificationSent = false;
    let autoReplySent = false;

    // 8. Persist in Supabase (PostgreSQL)
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error: dbError } = await supabase.from('contact_messages').insert([
          {
            name: sanitizedName,
            email: sanitizedEmail,
            topic: sanitizedTopic,
            message: sanitizedMessage,
            status: 'unread',
            ip_hash: ipHash,
            user_agent: request.headers.get('user-agent') || 'unknown'
          }
        ]);

        if (!dbError) {
          dbSaved = true;
        } else {
          console.error('[Supabase Error]', dbError.message);
        }
      } catch (err) {
        console.error('[Supabase Exception]', err);
      }
    }

    // 9. Send Notification & Auto-Reply via Resend
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const configuredFrom = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@mail.feliperiquel.me';
        // Formatear remitente limpio para no-reply
        const senderFrom = configuredFrom.includes('<')
          ? configuredFrom
          : `Felipe Riquelme <${configuredFrom}>`;

        // Email 1: Notification to Felipe
        const notifyResult = await resend.emails.send({
          from: senderFrom,
          to: [notificationEmail],
          replyTo: sanitizedEmail,
          subject: `[feliperiquel.me] Nuevo mensaje: ${sanitizedTopic}`,
          html: `
            <div style="background-color: #05070B; padding: 28px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Fira Code', monospace, sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #090D17; border: 1px solid #1B2338; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                
                <!-- Terminal Header Bar -->
                <tr>
                  <td style="background-color: #07090E; padding: 12px 18px; border-bottom: 1px solid #1B2338;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" style="width: 72px; min-width: 72px; white-space: nowrap; vertical-align: middle;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #EF4444; margin-right: 6px; vertical-align: middle;"></span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #F59E0B; margin-right: 6px; vertical-align: middle;"></span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #10B981; vertical-align: middle;"></span>
                        </td>
                        <td align="center" style="font-family: 'Fira Code', monospace; font-size: 11px; color: #64748B; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; vertical-align: middle;">
                          feliperiquel.me/telemetry-inbox
                        </td>
                        <td align="right" style="width: 72px; min-width: 72px; white-space: nowrap; vertical-align: middle; font-family: 'Fira Code', monospace; font-size: 10px; color: #00D2FF;">
                          [NUEVO]
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 28px 24px;">
                    <div style="display: inline-block; padding: 4px 10px; background-color: rgba(0, 210, 255, 0.08); border: 1px solid rgba(0, 210, 255, 0.25); border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 11px; color: #00D2FF; font-weight: 600; margin-bottom: 14px;">
                      TELEMETRIA // NUEVO CONTACTO
                    </div>
                    
                    <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                      ${escapedTopic}
                    </h2>

                    <!-- Sender Info Box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #07090E; border: 1px solid #1B2338; border-radius: 8px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 14px 16px; font-family: 'Fira Code', monospace; font-size: 12px; color: #94A3B8; line-height: 1.8;">
                          <div><strong style="color: #E2E8F0;">Remitente:</strong> ${escapedName}</div>
                          <div><strong style="color: #E2E8F0;">Correo:</strong> <a href="mailto:${escapedEmail}" style="color: #00D2FF; text-decoration: none;">${escapedEmail}</a></div>
                          <div><strong style="color: #E2E8F0;">Fecha UTC:</strong> ${new Date().toISOString()}</div>
                          <div><strong style="color: #E2E8F0;">Hash IP:</strong> <span style="color: #64748B;">${ipHash.slice(0, 16)}...</span></div>
                        </td>
                      </tr>
                    </table>

                    <!-- Message Body -->
                    <div style="font-family: 'Fira Code', monospace; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Cuerpo del mensaje:
                    </div>
                    <div style="background-color: #0D1322; border: 1px solid #1B2338; border-left: 3px solid #00D2FF; border-radius: 6px; padding: 16px; color: #F1F5F9; font-size: 14px; line-height: 1.6; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
${escapedMessage}
                    </div>

                    <!-- Action Button -->
                    <div style="margin-top: 24px; text-align: left;">
                      <a href="mailto:${escapedEmail}?subject=Re:%20${encodeURIComponent(sanitizedTopic)}" style="display: inline-block; background-color: #00D2FF; color: #05070B; font-family: 'Fira Code', monospace; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
                        Responder a ${escapedName} &rarr;
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #07090E; padding: 14px 24px; border-top: 1px solid #1B2338; font-family: 'Fira Code', monospace; font-size: 11px; color: #64748B;">
                    Pasarela de contacto automatizada de <strong style="color: #CBD5E1;">feliperiquel.me</strong>
                  </td>
                </tr>
              </table>
            </div>
          `
        });

        if (notifyResult.data) {
          notificationSent = true;
        } else if (notifyResult.error) {
          console.error('[Resend Notify Error]', JSON.stringify(notifyResult.error));
        }

        // Email 2: Auto-reply ACK to the sender
        const autoReplyResult = await resend.emails.send({
          from: senderFrom,
          to: [sanitizedEmail],
          replyTo: notificationEmail,
          subject: 'Mensaje recibido [ACK] | Felipe Riquelme',
          html: `
            <div style="background-color: #05070B; padding: 32px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Fira Code', monospace, sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #090D17; border: 1px solid #1B2338; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                
                <!-- Terminal Header Bar (Native macOS Style) -->
                <tr>
                  <td style="background-color: #07090E; padding: 12px 18px; border-bottom: 1px solid #1B2338;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" style="width: 72px; min-width: 72px; white-space: nowrap; vertical-align: middle;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #EF4444; margin-right: 6px; vertical-align: middle;"></span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #F59E0B; margin-right: 6px; vertical-align: middle;"></span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #10B981; vertical-align: middle;"></span>
                        </td>
                        <td align="center" style="font-family: 'Fira Code', monospace; font-size: 11px; color: #64748B; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; vertical-align: middle;">
                          feliperiquel.me/contact_gateway
                        </td>
                        <td align="right" style="width: 72px; min-width: 72px; white-space: nowrap; vertical-align: middle; font-family: 'Fira Code', monospace; font-size: 10px; color: #10B981;">
                          [200_OK]
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 26px;">
                    <!-- Pill Badge -->
                    <div style="display: inline-block; padding: 4px 10px; background-color: rgba(0, 210, 255, 0.08); border: 1px solid rgba(0, 210, 255, 0.25); border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 11px; color: #00D2FF; font-weight: 600; margin-bottom: 16px;">
                      ACK_SIGNAL // TELEMETRIA
                    </div>

                    <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                      Mensaje recibido con exito
                    </h1>

                    <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                      Hola <strong style="color: #FFFFFF;">${escapedName}</strong>,
                    </p>

                    <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Te confirmo que he recibido tu mensaje sobre <em style="color: #E2E8F0;">"${escapedTopic}"</em>. Revisare los antecedentes tecnicos y me pondre en contacto contigo a la brevedad.
                    </p>

                    <!-- Status Log Box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #07090E; border: 1px solid #1B2338; border-left: 3px solid #10B981; border-radius: 6px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 14px 16px; font-family: 'Fira Code', monospace; font-size: 12px; color: #94A3B8; line-height: 1.7;">
                          <div style="color: #10B981; font-weight: 700;">[ESTADO: REGISTRADO EN BASE DE DATOS]</div>
                          <div>Canal: Pasarela web directa (feliperiquel.me)</div>
                          <div>Timestamp UTC: ${new Date().toISOString()}</div>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                      Mientras tanto, puedes revisar el codigo de mis proyectos en GitHub o experimentar con las aplicaciones de audio y utilidades en el laboratorio:
                    </p>

                    <!-- Action Buttons -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td style="padding-right: 10px;">
                          <a href="https://github.com/Pipin333" target="_blank" style="display: inline-block; background-color: #1B2338; border: 1px solid #2B3856; color: #FFFFFF; font-family: 'Fira Code', monospace; font-size: 12px; font-weight: 600; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
                            GitHub @Pipin333 &rarr;
                          </a>
                        </td>
                        <td>
                          <a href="https://feliperiquel.me/lab" target="_blank" style="display: inline-block; background-color: #00D2FF; color: #05070B; font-family: 'Fira Code', monospace; font-size: 12px; font-weight: 700; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
                            Ver Laboratorio &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Signature Box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #1B2338; padding-top: 20px;">
                      <tr>
                        <td>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF;">
                            Felipe Riquelme
                          </div>
                          <div style="font-family: 'Fira Code', monospace; font-size: 11px; color: #00D2FF; margin-top: 2px;">
                            Ingeniero Civil en Informatica
                          </div>
                          <div style="font-family: 'Fira Code', monospace; font-size: 11px; color: #64748B; margin-top: 4px;">
                            <a href="https://feliperiquel.me" style="color: #64748B; text-decoration: none;">feliperiquel.me</a> &bull; Santiago, Chile
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Terminal Footer Status -->
                <tr>
                  <td style="background-color: #07090E; padding: 14px 24px; border-top: 1px solid #1B2338; font-family: 'Fira Code', monospace; font-size: 10px; color: #64748B; text-align: center; line-height: 1.5;">
                    <div>Confirmacion generada automaticamente por la pasarela de contacto de <strong style="color: #CBD5E1;">feliperiquel.me</strong>.</div>
                    <div style="color: #00D2FF; margin-top: 4px;">Puedes responder directamente a este correo para continuar la conversacion.</div>
                  </td>
                </tr>

              </table>
            </div>
          `
        });

        if (autoReplyResult.data) {
          autoReplySent = true;
        } else if (autoReplyResult.error) {
          console.error('[Resend AutoReply Error]', JSON.stringify(autoReplyResult.error));
        }
      } catch (err) {
        console.error('[Resend Exception]', err);
      }
    }

    const isConfigured = Boolean(supabaseUrl || resendApiKey);
    if (!isConfigured) {
      console.log('[Dev Contact Gateway - Sin credenciales configuradas]');
      console.log({ sanitizedName, sanitizedEmail, sanitizedTopic, sanitizedMessage, ipHash });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '¡Mensaje recibido con exito! Se ha registrado y te responderemos a la brevedad.',
        details: {
          persisted: dbSaved,
          notified: notificationSent,
          autoReply: autoReplySent,
          mode: isConfigured ? 'live' : 'development-simulated'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
          'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS_PER_WINDOW - (memRecord ? memRecord.count : 1)).toString()
        }
      }
    );
  } catch (error) {
    console.error('[Contact API Fatal Error]', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Ocurrio un error inesperado al procesar tu solicitud. Por favor intenta de nuevo o escribe directamente.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
