# ADR-0002: Hardening de CSP en Vercel Edge y Orígenes del Laboratorio

- **Estado**: Aceptado
- **Fecha**: 2026-10-23
- **Decisores**: Felipe Riquelme, Agente Antigravity

---

## 1. Contexto y Problema

El sitio web está configurado con cabeceras de seguridad HTTP de nivel bancario en `vercel.json`, incluyendo `Content-Security-Policy` (CSP) estricta, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.

Al desplegar las micro-aplicaciones interactivas del laboratorio (`/lab`), se presentaron dos conflictos técnicos:
1. **Bloqueo de WebSockets y Fetch en Ni Idea (`/lab/quiz`)**: La aplicación de trivia multijugador en tiempo real se conecta a un Cloudflare Worker con Durable Objects en `https://ni-idea.pipin333.workers.dev` y abre canales WebSocket en `wss://ni-idea.pipin333.workers.dev`. La directiva `connect-src 'self'` original bloqueaba de raíz estas conexiones en producción con un error de seguridad en la consola del navegador.
2. **Atributos de estilo dinámicos en SonicRip Studio (`/lab/sonicrip`)**: SonicRip procesa audio en el navegador mediante la Web Audio API y actualiza en tiempo real las alturas de los vúmetros y faders de las 8 bandas de ecualización (`style="height: ...%"`). Una directiva `style-src 'self'` sin `'unsafe-inline'` impedía la reactividad visual del analizador de espectro FFT.

---

## 2. Decisión

1. **Autorizar orígenes legítimos en `connect-src`**: Ampliar la directiva en `vercel.json` para permitir explícitamente el backend de Cloudflare Workers:
   ```json
   "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://ni-idea.pipin333.workers.dev wss://ni-idea.pipin333.workers.dev;"
   ```
2. **Mantener controladamente `'unsafe-inline'` únicamente en `style-src`**: Permitir atributos de estilo en línea para la renderización fluida a 60 FPS de los faders de audio en SonicRip.
3. **Cero concesiones en `script-src`**: Se mantiene `script-src 'self'`, garantizando que no se puedan ejecutar scripts remotos ni inyecciones de código JavaScript inline no autorizadas.

---

## 3. Alternativas Consideradas

- **Proxy serverless intermedio a través de Vercel API Routes (`/api/quiz-proxy`)**:
  - *Ventaja*: Mantendría `connect-src 'self'` sin orígenes externos.
  - *Desventaja*: Vercel Serverless Functions no soportan WebSockets bidireccionales persistentes sin costes adicionales o intermediarios; añadiría latencia crítica a un juego de fiesta en tiempo real.
- **Refactorizar de inmediato SonicRip para usar clases utilitarias dinámicas o CSS Variables**:
  - *Ventaja*: Permitiría remover `'unsafe-inline'` de `style-src`.
  - *Desventaja*: Modificar los ~96 puntos de enlace reactivo en la fase de audio en vivo introducía un alto radio de explosión con riesgo de degradar el rendimiento a 60 FPS del analizador de frecuencias FFT. Se planifica como una refactorización aislada a futuro.

---

## 4. Consecuencias

### Positivas
- Ni Idea (`/lab/quiz`) opera con latencia mínima conectando directamente al backend distribuido en Cloudflare Workers Edge.
- SonicRip Studio mantiene fluidez de 60 FPS en el analizador FFT y ecualizador paramétrico.
- La protección contra ataques XSS mediante inyección de scripts se mantiene hermética al no relajar `script-src`.

### Negativas / Mitigaciones
- La presencia de `'unsafe-inline'` en `style-src` genera observaciones en auditorías automatizadas estrictas de CSP. Esta concesión está documentada y acotada al subsistema de audio de SonicRip.
