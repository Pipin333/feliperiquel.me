import type { APIRoute } from 'astro';
import { z } from 'astro/zod';

export const prerender = false;

// Prompts Few-Shot refinados de Retórica y Descalabro
export const SYSTEM_PROMPTS: Record<string, string> = {
  enricher_1: `Eres un maestro de la diplomacia, la redacción institucional y la elegancia formal.
Transforma el texto del usuario a un registro formal impecable, propio de correspondencia diplomática o un comunicado oficial solemne.
Conserva el significado nuclear del mensaje pero con exquisita cortesía y vocablo culto.
Responde ÚNICAMENTE con el texto transformado.`,

  enricher_2: `Eres un catedrático erudito de filosofía y sociología del siglo XIX.
Transforma el texto del usuario (que puede ser jerga, reggaetón, modismos o frases cotidianas) a un tratado académico ultra-rimbombante, formal y denso.
Utiliza perífrasis complejas, sinónimos latinizados y descripciones antropológicas, biológicas o pseudocientíficas para cualquier concepto callejero o carnal.
Ejemplo de referencia:
Entrada: "Sigue tu camino que sin ti me va mejor, ahora tengo otras que me lo hacen mejor"
Salida: "Continúa con tu sendero porque en tu ausencia la calidad de mi vida ha aumentado; actualmente poseo a otras entidades femeninas que copulan más satisfactoriamente con mi persona."
Conserva con precisión quirúrgica el mensaje nuclear pero enmascarado en la más pomposa pedantería académica.
Responde ÚNICAMENTE con el texto resultante.`,

  enricher_3: `Eres un poeta del Siglo de Oro español, discípulo extremo de Luis de Góngora y el culteranismo barroco.
Transforma el texto del usuario a un estilo rococó, barroco y conceptualmente hiperbólico al límite de lo absurdo.
Usa hipérbaton, metáforas mitológicas, perífrasis interminables y vocabulario barroco grandilocuente.
Responde ÚNICAMENTE con el texto resultante.`,

  whispers: `Eres un simulador de 'Teléfono Descompuesto' (Chinese Whispers) multilingüe y malentendido auditivo (mondegreens).
Tu labor es tomar el texto de entrada (letras de canciones urbanas, modismos, mensajes hablados) y devolver lo que resultaría de:
1. Malentendidos acústicos propios de canciones oídas a la rápida (interpretar sonidos por palabras absurdas parecidas).
2. Traducción literal sin modismos a través de varios idiomas exóticos y vuelta al español tosco.
3. Desmoronamiento de frases hechas en conceptos cómicos y literales.
Ejemplo de referencia:
Entrada: "Hoy pienso que ella me ama porque amanezco en su cama. Van varias noche de eso, creo que la matan mis besos. Siento que puedo nadar, flotando entre sus piernas pongo dulce el mar. Yo no necesito un GPS pa' llegarte siempre donde estés."
Salida: "Ahora creo que la dama me tiene afecto pues despierto en su colchón. Han transcurrido veladas similares; intuyo que mis roces orales le quitan el aliento. Experimento la sensación de flotar cual bañista en el océano salobre. Prescindo de navegación satelital para aproximarme a sus inmediaciones."
Aplica este mismo fenómeno al texto que te proporcione el usuario, respetando su estructura estrófica o en párrafos.
Responde ÚNICAMENTE con la versión descompuesta.`
};

// Validación y defensa anti-SSRF para base_url
function isSafeBaseUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;

    // Permitir desarrollo local con Ollama
    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      return true;
    }

    // Exigir HTTPS para cualquier proveedor externo
    if (parsed.protocol !== 'https:') return false;

    // Bloquear IPs de metadatos cloud y rangos privados
    if (/^(169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const RetoricaSchema = z.object({
  action: z.enum(['enrich', 'whispers']),
  text: z.string().trim().min(1, 'El texto no puede estar vacío').max(10000, 'Máximo 10.000 caracteres'),
  formality_level: z.number().int().min(1).max(3).optional().default(2),
  llm: z.object({
    base_url: z.string().trim().default('https://api.groq.com/openai/v1'),
    api_key: z.string().trim().optional(),
    model: z.string().trim().max(120).default('llama-3.3-70b-versatile')
  })
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return new Response(JSON.stringify({ error: 'Cuerpo de solicitud inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsed = RetoricaSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { action, text, formality_level, llm } = parsed.data;

    // 1. Mitigación SSRF estricta sobre la URL del LLM
    if (!isSafeBaseUrl(llm.base_url)) {
      return new Response(
        JSON.stringify({
          error: 'URL de proveedor no válida o denegada por seguridad (SSRF protection). Debe ser HTTPS pública o localhost.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Selección del System Prompt según la acción solicitada
    let systemPrompt = SYSTEM_PROMPTS.enricher_2;
    if (action === 'whispers') {
      systemPrompt = SYSTEM_PROMPTS.whispers;
    } else if (formality_level === 1) {
      systemPrompt = SYSTEM_PROMPTS.enricher_1;
    } else if (formality_level === 3) {
      systemPrompt = SYSTEM_PROMPTS.enricher_3;
    }

    const targetUrl = `${llm.base_url.replace(/\/+$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (llm.api_key) {
      headers['Authorization'] = `Bearer ${llm.api_key}`;
    }

    const payload = {
      model: llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: action === 'whispers' ? 0.85 : 0.7,
      max_tokens: 2048
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Tiempo de espera agotado al conectar con el proveedor LLM (timeout 25s).' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Fallo de red al conectar con el proveedor LLM: ${fetchErr.message}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let parsedMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedMsg = errJson.error?.message || errText;
      } catch {}
      return new Response(
        JSON.stringify({
          error: `El proveedor LLM respondió con error HTTP ${res.status}: ${parsedMsg}`
        }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const completion = await res.json().catch(() => null);
    const resultText = completion?.choices?.[0]?.message?.content?.trim();

    if (!resultText) {
      return new Response(
        JSON.stringify({ error: 'El proveedor LLM no devolvió texto en la respuesta.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: resultText,
        model: llm.model,
        mode: action === 'whispers' ? 'whispers_llm' : `enricher_${formality_level}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Error interno al procesar transmutación: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
