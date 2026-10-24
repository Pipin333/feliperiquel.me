import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function renderDecorative(type, accent) {
  switch (type) {
    case 'audio':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <path d="M 780 320 Q 840 180 920 280 T 1040 220 T 1120 340" />
          <path d="M 780 360 Q 860 240 940 320 T 1060 260 T 1120 380" stroke-dasharray="4 4" />
          <rect x="800" y="240" width="12" height="140" fill="${accent}" opacity="0.3" rx="2" />
          <rect x="830" y="200" width="12" height="180" fill="${accent}" opacity="0.4" rx="2" />
          <rect x="860" y="160" width="12" height="220" fill="${accent}" opacity="0.5" rx="2" />
          <rect x="890" y="220" width="12" height="160" fill="${accent}" opacity="0.4" rx="2" />
          <rect x="920" y="190" width="12" height="190" fill="${accent}" opacity="0.45" rx="2" />
          <rect x="950" y="150" width="12" height="230" fill="${accent}" opacity="0.55" rx="2" />
          <rect x="980" y="260" width="12" height="120" fill="${accent}" opacity="0.3" rx="2" />
          <rect x="1010" y="280" width="12" height="100" fill="${accent}" opacity="0.25" rx="2" />
          <circle cx="950" cy="150" r="4" fill="${accent}" />
          <circle cx="860" cy="160" r="4" fill="${accent}" />
        </g>
      `;
    case 'finflow':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <rect x="820" y="170" width="280" height="170" rx="14" stroke="${accent}" stroke-width="2" />
          <line x1="820" y1="220" x2="1100" y2="220" stroke="${accent}" stroke-width="1" />
          <rect x="850" y="245" width="45" height="35" rx="5" stroke="${accent}" />
          <circle cx="1040" cy="295" r="14" stroke="${accent}" />
          <circle cx="1060" cy="295" r="14" stroke="${accent}" />
          <path d="M 780 430 C 860 410, 920 370, 990 320 S 1080 240, 1130 190" stroke="${accent}" stroke-width="3" />
          <circle cx="1130" cy="190" r="5" fill="${accent}" />
        </g>
      `;
    case 'quiz':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <circle cx="950" cy="250" r="70" stroke="${accent}" stroke-width="2" />
          <circle cx="950" cy="250" r="120" stroke="${accent}" stroke-dasharray="6 6" />
          <circle cx="950" cy="250" r="180" stroke="${accent}" stroke-dasharray="3 9" />
          <circle cx="900" cy="200" r="8" fill="${accent}" />
          <circle cx="1000" cy="200" r="8" fill="${accent}" />
          <circle cx="890" cy="290" r="8" fill="${accent}" />
          <circle cx="1010" cy="290" r="8" fill="${accent}" />
          <circle cx="950" cy="130" r="10" fill="${accent}" />
          <circle cx="1070" cy="250" r="10" fill="${accent}" />
          <line x1="900" y1="200" x2="1000" y2="200" stroke="${accent}" />
          <line x1="900" y1="200" x2="890" y2="290" stroke="${accent}" />
          <line x1="1000" y1="200" x2="1010" y2="290" stroke="${accent}" />
          <line x1="890" y1="290" x2="1010" y2="290" stroke="${accent}" />
        </g>
      `;
    case 'retorica':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <path d="M 850 140 C 900 180, 920 280, 890 380 C 870 440, 920 450, 940 460" stroke-width="2" />
          <path d="M 980 140 C 930 180, 910 280, 940 380 C 960 440, 910 450, 890 460" stroke-width="2" />
          <circle cx="915" cy="150" r="12" stroke="${accent}" />
          <circle cx="915" cy="450" r="12" stroke="${accent}" />
          <rect x="800" y="210" width="230" height="180" rx="8" stroke-dasharray="4 4" />
          <text x="915" y="310" font-family="Times New Roman, serif" font-size="64" fill="${accent}" text-anchor="middle" font-style="italic">§</text>
        </g>
      `;
    case 'copete':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <rect x="880" y="180" width="120" height="240" rx="20" stroke="${accent}" stroke-width="2" />
          <line x1="920" y1="130" x2="960" y2="130" stroke="${accent}" stroke-width="2" />
          <line x1="920" y1="130" x2="920" y2="180" stroke="${accent}" stroke-width="2" />
          <line x1="960" y1="130" x2="960" y2="180" stroke="${accent}" stroke-width="2" />
          <line x1="980" y1="220" x2="1000" y2="220" stroke="${accent}" />
          <line x1="970" y1="260" x2="1000" y2="260" stroke="${accent}" />
          <line x1="980" y1="300" x2="1000" y2="300" stroke="${accent}" />
          <line x1="970" y1="340" x2="1000" y2="340" stroke="${accent}" />
          <circle cx="830" cy="260" r="12" stroke="${accent}" />
          <circle cx="860" cy="320" r="12" stroke="${accent}" />
          <line x1="865" y1="250" x2="825" y2="330" stroke="${accent}" stroke-width="2" />
        </g>
      `;
    case 'proyectos':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <rect x="820" y="170" width="120" height="70" rx="8" stroke="${accent}" stroke-width="2" />
          <rect x="990" y="170" width="120" height="70" rx="8" stroke="${accent}" stroke-width="2" />
          <rect x="905" y="310" width="130" height="80" rx="8" stroke="${accent}" stroke-width="2" />
          <line x1="880" y1="240" x2="940" y2="310" stroke="${accent}" stroke-width="1.5" />
          <line x1="1050" y1="240" x2="1000" y2="310" stroke="${accent}" stroke-width="1.5" />
          <circle cx="845" cy="195" r="4" fill="${accent}" />
          <circle cx="1015" cy="195" r="4" fill="${accent}" />
          <circle cx="930" cy="335" r="4" fill="${accent}" />
          <line x1="865" y1="195" x2="915" y2="195" stroke="${accent}" stroke-width="2" />
          <line x1="1035" y1="195" x2="1085" y2="195" stroke="${accent}" stroke-width="2" />
        </g>
      `;
    case 'cv':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <rect x="850" y="150" width="220" height="290" rx="12" stroke="${accent}" stroke-width="2" />
          <line x1="880" y1="190" x2="1040" y2="190" stroke="${accent}" stroke-width="3" />
          <line x1="880" y1="230" x2="1000" y2="230" stroke="${accent}" stroke-width="2" />
          <line x1="880" y1="260" x2="1020" y2="260" stroke="${accent}" stroke-width="1.5" />
          <line x1="880" y1="290" x2="980" y2="290" stroke="${accent}" stroke-width="1.5" />
          <line x1="880" y1="340" x2="1040" y2="340" stroke="${accent}" stroke-width="2" />
          <line x1="880" y1="370" x2="960" y2="370" stroke="${accent}" stroke-width="1.5" />
          <circle cx="1020" cy="390" r="16" stroke="${accent}" stroke-width="2" />
          <polyline points="1013 390 1018 395 1028 385" stroke="${accent}" stroke-width="2" />
        </g>
      `;
    case 'sobre-mi':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <circle cx="950" cy="230" r="60" stroke="${accent}" stroke-width="2" />
          <path d="M 870 380 C 870 320, 910 310, 950 310 C 990 310, 1030 320, 1030 380" stroke="${accent}" stroke-width="2" />
          <rect x="820" y="140" width="260" height="270" rx="16" stroke-dasharray="6 6" />
          <line x1="820" y1="180" x2="1080" y2="180" stroke="${accent}" />
        </g>
      `;
    case 'lab':
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <path d="M 930 160 L 970 160 L 970 230 L 1040 360 C 1055 385, 1040 410, 1005 410 L 895 410 C 860 410, 845 385, 860 360 L 930 230 Z" stroke="${accent}" stroke-width="2.5" />
          <line x1="910" y1="160" x2="990" y2="160" stroke="${accent}" stroke-width="3" />
          <circle cx="945" cy="340" r="10" stroke="${accent}" />
          <circle cx="975" cy="310" r="6" stroke="${accent}" />
          <circle cx="920" cy="370" r="7" stroke="${accent}" />
        </g>
      `;
    case 'home':
    default:
      return `
        <g opacity="0.25" stroke="${accent}" fill="none" stroke-width="1.5">
          <rect x="830" y="160" width="260" height="180" rx="12" stroke="${accent}" stroke-width="2" />
          <line x1="830" y1="200" x2="1090" y2="200" stroke="${accent}" />
          <circle cx="855" cy="180" r="4" fill="${accent}" />
          <circle cx="875" cy="180" r="4" fill="${accent}" />
          <circle cx="895" cy="180" r="4" fill="${accent}" />
          <polyline points="855 240 870 255 855 270" stroke="${accent}" stroke-width="2.5" />
          <line x1="880" y1="270" x2="920" y2="270" stroke="${accent}" stroke-width="2.5" />
          <path d="M 770 410 Q 860 340 950 410 T 1130 410" stroke="${accent}" stroke-width="2" />
          <circle cx="950" cy="410" r="6" fill="${accent}" />
        </g>
      `;
  }
}

function generateOGSvg(config) {
  const {
    badge,
    accent,
    accentDim,
    kicker,
    title,
    subtitleLines,
    tags,
    decorativeType
  } = config;

  let currentTagX = 64;
  const tagSvgs = tags.map((tag) => {
    const textWidth = tag.length * 9.5 + 24;
    const x = currentTagX;
    currentTagX += textWidth + 12;
    return `
      <g transform="translate(${x}, 462)">
        <rect width="${textWidth}" height="32" rx="6" fill="#0D1322" stroke="#26334D" stroke-width="1.2" />
        <text x="${textWidth / 2}" y="20.5" font-family="Segoe UI, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#CBD5E1" text-anchor="middle">${escapeXml(tag)}</text>
      </g>
    `;
  }).join('');

  const subtitleSvg = subtitleLines.map((line, idx) => `
    <text x="64" y="${360 + idx * 36}" font-family="Segoe UI, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#94A3B8">${escapeXml(line)}</text>
  `).join('');

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ambientGlow" cx="80%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.18" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#07090E" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="subtleBottomGlow" cx="20%" cy="85%" r="40%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.07" />
      <stop offset="100%" stop-color="#07090E" stop-opacity="0" />
    </radialGradient>

    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="0.7" opacity="0.35" />
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#07090E" />
  <rect width="1200" height="630" fill="url(#ambientGlow)" />
  <rect width="1200" height="630" fill="url(#subtleBottomGlow)" />
  <rect width="1200" height="630" fill="url(#grid)" />

  <rect x="24" y="24" width="1152" height="582" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5" />

  <path d="M 24 50 L 24 24 L 50 24" fill="none" stroke="${accent}" stroke-width="2.5" />
  <path d="M 1176 50 L 1176 24 L 1150 24" fill="none" stroke="${accent}" stroke-width="2.5" />
  <path d="M 24 580 L 24 606 L 50 606" fill="none" stroke="${accent}" stroke-width="2.5" />
  <path d="M 1176 580 L 1176 606 L 1150 606" fill="none" stroke="${accent}" stroke-width="2.5" />

  <g transform="translate(64, 60)">
    <rect width="38" height="38" rx="8" fill="#0D1322" stroke="#1E293B" stroke-width="1.5" />
    <polyline points="12 14 18 19 12 24" fill="none" stroke="#00F0FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="20" y1="24" x2="26" y2="24" stroke="#00F0FF" stroke-width="2.2" stroke-linecap="round" />
    <text x="50" y="26" font-family="Segoe UI, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">feliperiquel<tspan fill="#00F0FF">.me</tspan></text>
  </g>

  <g transform="translate(1136, 60)">
    <rect x="-${badge.length * 9.2 + 28}" y="0" width="${badge.length * 9.2 + 28}" height="38" rx="19" fill="${accentDim}" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.5" />
    <circle cx="-${badge.length * 9.2 + 14}" cy="19" r="4.5" fill="${accent}" />
    <text x="-14" y="24" font-family="Consolas, monospace" font-size="12.5" font-weight="700" fill="${accent}" text-anchor="end" letter-spacing="1">${escapeXml(badge)}</text>
  </g>

  ${renderDecorative(decorativeType, accent)}

  <text x="64" y="215" font-family="Consolas, monospace" font-size="13.5" font-weight="700" fill="${accent}" letter-spacing="1.5">${escapeXml(kicker)}</text>
  <text x="64" y="285" font-family="Segoe UI, -apple-system, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(title)}</text>
  ${subtitleSvg}
  ${tagSvgs}

  <line x1="64" y1="535" x2="1136" y2="535" stroke="#1E293B" stroke-width="1" />
  <text x="64" y="568" font-family="Consolas, monospace" font-size="12.5" font-weight="600" fill="#64748B" letter-spacing="0.5">FELIPE RIQUELME · INGENIERO CIVIL EN INFORMÁTICA · SANTIAGO, CL</text>
  <text x="1136" y="568" font-family="Consolas, monospace" font-size="12.5" font-weight="700" fill="#00F0FF" text-anchor="end" letter-spacing="1">HTTPS://FELIPERIQUEL.ME</text>
</svg>
  `.trim();
}

const configs = [
  {
    filename: 'og-home.png',
    badge: 'PORTAFOLIO & LABORATORIO',
    accent: '#00F0FF',
    accentDim: 'rgba(0, 240, 255, 0.12)',
    kicker: 'INGENIERÍA DE SOFTWARE & AUDIO DSP',
    title: 'Felipe Riquelme',
    subtitleLines: [
      'Portafolio y laboratorio interactivo de software. Audio DSP en el navegador,',
      'micro-aplicaciones en tiempo real, orquestación homelab y optimización.'
    ],
    tags: ['Web Audio API', 'TypeScript', 'Docker', 'Python', 'Astro'],
    decorativeType: 'home'
  },
  {
    filename: 'og-proyectos.png',
    badge: 'ARQUITECTURA DE SISTEMAS & HOMELAB',
    accent: '#38BDF8',
    accentDim: 'rgba(56, 189, 248, 0.12)',
    kicker: 'PROYECTOS OPEN SOURCE & INVESTIGACIÓN',
    title: 'Proyectos Destacados',
    subtitleLines: [
      'Sistemas distribuidos, streaming de audio con ML (Implicit ALS), puentes automatizados',
      'de mensajería, sincronización académica e investigación algorítmica continua.'
    ],
    tags: ['Toodles (ALS + Item2Vec)', 'Whatsarr', 'UniCalendar AI', 'AD-BSA (CEC 2020)'],
    decorativeType: 'proyectos'
  },
  {
    filename: 'og-sobre-mi.png',
    badge: 'PERFIL & INFRAESTRUCTURA',
    accent: '#818CF8',
    accentDim: 'rgba(129, 140, 248, 0.12)',
    kicker: 'TRAYECTORIA & PRINCIPIOS DE INGENIERÍA',
    title: 'Sobre Mí',
    subtitleLines: [
      'Ingeniero Civil en Informática (UNAB). Especialización en arquitectura de software,',
      'procesamiento digital de señales, servidores homelab bare-metal y sistemas eficientes.'
    ],
    tags: ['Ingeniería Civil', 'UNAB', 'Homelab Linux', 'Clean Architecture'],
    decorativeType: 'sobre-mi'
  },
  {
    filename: 'og-cv.png',
    badge: 'CURRÍCULUM VITAE & TRAYECTORIA',
    accent: '#34D399',
    accentDim: 'rgba(52, 211, 153, 0.12)',
    kicker: 'EXPERIENCIA PROFESIONAL & STACK',
    title: 'Currículum Vitae',
    subtitleLines: [
      'Ficha profesional estructurada con experiencia laboral, proyectos nucleares,',
      'stack tecnológico y opción de descarga directa en formato PDF vectorial.'
    ],
    tags: ['Full-Stack', 'Audio DSP', 'Sistemas Distribuidos', 'PDF Export'],
    decorativeType: 'cv'
  },
  {
    filename: 'og-lab.png',
    badge: 'SUITE DE HERRAMIENTAS & EXPERIMENTOS',
    accent: '#A855F7',
    accentDim: 'rgba(168, 85, 247, 0.12)',
    kicker: 'EL LABORATORIO (/LAB)',
    title: 'Suite de Herramientas Web',
    subtitleLines: [
      'Catálogo de 5 micro-aplicaciones cliente en tiempo real. Procesamiento DSP,',
      'transmutación lingüística, optimización de eventos, party games y finanzas PWA.'
    ],
    tags: ['SonicRip', 'Retórica', 'Cuánto Rinde', 'Ni Idea', 'FinFlow'],
    decorativeType: 'lab'
  },
  {
    filename: 'og-sonicrip.png',
    badge: 'AUDIO DSP & WEB AUDIO API',
    accent: '#F59E0B',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    kicker: 'PROCESAMIENTO DE AUDIO EN NAVEGADOR',
    title: 'SonicRip Studio',
    subtitleLines: [
      'Suite de audio con ecualizador paramétrico de 8 bandas (BiquadFilterNode),',
      'distorsión Lo-Fi Bitcrusher, analizador FFT y generador de comandos batch para yt-dlp.'
    ],
    tags: ['Web Audio API', 'FFT Analyzer', 'BiquadFilterNode', 'yt-dlp Batch'],
    decorativeType: 'audio'
  },
  {
    filename: 'og-retorica.png',
    badge: 'TRANSMUTADOR LINGÜÍSTICO & HUMOR',
    accent: '#EAB308',
    accentDim: 'rgba(234, 179, 8, 0.12)',
    kicker: 'LABORATORIO LINGÜÍSTICO EXPERIMENTAL',
    title: 'Retórica y Descalabro',
    subtitleLines: [
      'Transmutador de jerga coloquial a prosa decimonónica y tratados barrocos.',
      'Motor heurístico local de sustitución con inferencia neuronal BYOK opcional.'
    ],
    tags: ['Heurística Local', 'Inferencia BYOK', 'Anti-SSRF Proxy', 'Open Source'],
    decorativeType: 'retorica'
  },
  {
    filename: 'og-copete.png',
    badge: 'OPTIMIZADOR LOGÍSTICO & PRESUPUESTOS',
    accent: '#84CC16',
    accentDim: 'rgba(132, 204, 22, 0.12)',
    kicker: 'LOGÍSTICA Y REPARTO PRESUPUESTARIO EN $ CLP',
    title: 'Cuánto Rinde',
    subtitleLines: [
      'Calculadora logística y presupuestaria para juntas y eventos sociales con algoritmo',
      'de balance de consumo, cálculo de cuotas y exportación estructurada para WhatsApp.'
    ],
    tags: ['Algoritmo de Reparto', 'Presupuestos $ CLP', 'Exportación WhatsApp'],
    decorativeType: 'copete'
  },
  {
    filename: 'og-quiz.png',
    badge: 'PARTY GAME WEBSOCKETS EN TIEMPO REAL',
    accent: '#F43F5E',
    accentDim: 'rgba(244, 63, 94, 0.12)',
    kicker: 'MULTIJUGADOR EN TIEMPO REAL',
    title: 'Ni Idea',
    subtitleLines: [
      'Party game interactivo para jugar con amigos desde el navegador con salas efímeras,',
      'WebSockets, Cloudflare Durable Objects y 3 modos de juego rotativos.'
    ],
    tags: ['WebSockets', 'Cloudflare Durable Objects', 'Canvas HTML5', 'Salas Efímeras'],
    decorativeType: 'quiz'
  },
  {
    filename: 'og-finflow.png',
    badge: 'TERMINAL FINANCIERO PWA OFFLINE-FIRST',
    accent: '#10B981',
    accentDim: 'rgba(16, 185, 129, 0.12)',
    kicker: 'CONTROL FINANCIERO PERSONAL Y DEUDAS',
    title: 'FinFlow',
    subtitleLines: [
      'Terminal financiero PWA offline-first en React 19 + TypeScript. Control de cuentas,',
      'tarjetas con fechas de corte, cuotas sin interés y compresión local de boletas (80KB).'
    ],
    tags: ['React 19', 'PWA Offline-First', 'Canvas Compression', 'LocalStorage Privado'],
    decorativeType: 'finflow'
  }
];

async function buildAll() {
  const ogDir = path.resolve('public/og');
  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  for (const cfg of configs) {
    const svg = generateOGSvg(cfg);
    const destPath = path.join(ogDir, cfg.filename);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 95 })
      .toFile(destPath);
    console.log(`Generated: public/og/${cfg.filename}`);

    if (cfg.filename === 'og-home.png') {
      const rootOgPath = path.resolve('public/og-image.png');
      await sharp(Buffer.from(svg))
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(rootOgPath);
      console.log('Updated: public/og-image.png');
    }
  }

  console.log(`Successfully generated ${configs.length} custom OG images!`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
