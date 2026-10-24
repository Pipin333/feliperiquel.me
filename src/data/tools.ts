// src/data/tools.ts

export interface ToolSpec {
  label: string;
  value: string;
}

export interface LabTool {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  tags: string[];
  href: string;
  canonicalHref?: string;
  canonicalLabel?: string;
  accentColor: string;
  badge: string;
  highlightBadge: string;
  cardGlowClass: string;
  iconColorClass: string;
  taglineClass: string;
  btnClass: string;
  btnIconClass?: string;
  gridColor: string;
  ambientAuraClass: string;
  isComingSoon?: boolean;
  comingSoonText?: string;
  specs: ToolSpec[];
}

export const featuredTools: LabTool[] = [
  {
    id: "sonicrip",
    title: "SonicRip Studio",
    tagline: "Procesador DSP, EQ de 8 Bandas & VFD Spectrum Analyzer",
    description: "Carga audio en el navegador, aplica curvas de ecualización en tiempo real (BiquadFilterNode), distorsión Lo-Fi Bitcrusher y visualiza armónicos en un analizador de espectro segmentado VFD estilo Pioneer.",
    icon: "sliders",
    tags: ["Web Audio API", "DSP", "VFD Matrix", "8-Band EQ"],
    href: "/lab/sonicrip",
    accentColor: "text-cyan-300 border-cyan-500/40 bg-cyan-950/40",
    badge: "Audio DSP",
    highlightBadge: "Destacado del Día: Procesamiento DSP",
    cardGlowClass: "border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.22)]",
    iconColorClass: "text-cyan-400 bg-cyan-950/60 border-cyan-500/40",
    taglineClass: "font-mono text-cyan-300",
    btnClass: "text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 border border-cyan-200/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]",
    btnIconClass: "text-slate-950",
    gridColor: "rgba(6, 182, 212, 0.22)",
    ambientAuraClass: "from-cyan-500/15 via-cyan-950/5 to-transparent",
    specs: [
      { label: "Display de Espectro", value: "Matriz VFD de 32 bandas con Peak Hold" },
      { label: "Motor DSP", value: "Web Audio API (8 filtros Biquad en serie)" },
      { label: "Procesamiento", value: "100% In-Browser sin subir archivos" }
    ]
  },
  {
    id: "finflow",
    title: "FinFlow",
    tagline: "Terminal Financiero PWA & Ciclos de Tarjetas Offline-First",
    description: "Control inteligente de finanzas personales, múltiples cuentas bancarias, billeteras de efectivo y tarjetas de crédito con compras en cuotas y ciclos de facturación personalizados. Cero trackers, 100% privado en LocalStorage.",
    icon: "wallet2",
    tags: ["React 19", "TypeScript", "Offline-First", "PWA", "LocalStorage", "Vitest"],
    href: "/lab/finflow",
    canonicalHref: "https://github.com/Pipin333/finflow",
    canonicalLabel: "Repo Canónico",
    accentColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
    badge: "PWA Offline-First",
    highlightBadge: "Destacado del Día: Finanzas & Privacidad",
    cardGlowClass: "border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.2)]",
    iconColorClass: "text-emerald-400 bg-emerald-950/60 border-emerald-500/40",
    taglineClass: "font-mono text-emerald-300",
    btnClass: "text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 border border-emerald-200/50 shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    btnIconClass: "text-slate-950",
    gridColor: "rgba(16, 185, 129, 0.22)",
    ambientAuraClass: "from-emerald-500/15 via-emerald-950/5 to-transparent",
    specs: [
      { label: "Modelo de Datos", value: "100% LocalStorage sin servidores" },
      { label: "Financiamiento", value: "Ciclos de corte y cuotas sin interés" },
      { label: "Comprobantes", value: "Compresión Canvas en cliente (80KB)" }
    ]
  },
  {
    id: "retorica",
    title: "Retórica y Descalabro",
    tagline: "Transmutador Ontológico & Scriptorium Medieval",
    description: "Convierte modismos coloquiales y letras urbanas en tratados filosóficos decimonónicos, correspondencia diplomática de cancillería o culteranismo barroco con motor dual heurístico y BYOK LLM.",
    icon: "bank2",
    tags: ["NLP Heurístico", "BYOK LLM", "Scriptorium", "TypeScript"],
    href: "/lab/retorica",
    canonicalHref: "https://github.com/Pipin333/retorica-y-descalabro",
    canonicalLabel: "Repo Canónico",
    accentColor: "text-purple-300 border-purple-500/40 bg-purple-950/40",
    badge: "Medieval NLP",
    highlightBadge: "Destacado del Día: Lingüística & NLP",
    cardGlowClass: "border-purple-500/50 shadow-[0_0_35px_rgba(147,51,234,0.18)]",
    iconColorClass: "text-amber-400 bg-purple-950/60 border-purple-500/40",
    taglineClass: "font-serif italic text-purple-300",
    btnClass: "text-amber-100 bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 border border-amber-400/40 shadow-[0_0_20px_rgba(147,51,234,0.3)]",
    btnIconClass: "text-amber-300",
    gridColor: "rgba(168, 85, 247, 0.22)",
    ambientAuraClass: "from-purple-600/15 via-purple-950/5 to-transparent",
    specs: [
      { label: "Modo de Inferencia", value: "Heurístico Local + LLM Opcional" },
      { label: "Ejecución", value: "Cliente puro (cero latencia)" },
      { label: "Estilo", value: "Cancillería y Filosofía Decimonónica" }
    ]
  },
  {
    id: "copete",
    title: "Cuánto Rinde",
    tagline: "Optimizador Logístico & Presupuesto (Repo: calculadoracopete)",
    description: "Cálculo matemático de bebidas, destilados, hielo y mixers para juntas y eventos según perfil de consumo y duración. Desacoplándose como aplicación independiente con workers dedicados, privacidad y términos propios.",
    icon: "cup-straw",
    tags: ["Algoritmia", "Logística", "Presupuesto", "Workers"],
    href: "/lab/copete",
    canonicalHref: "https://github.com/Pipin333/calculadoracopete",
    canonicalLabel: "Repo Canónico",
    accentColor: "text-domain-beer border-domain-beer/30 bg-domain-beer/10",
    badge: "En Preparación",
    highlightBadge: "Destacado del Día: Algoritmia Logística",
    cardGlowClass: "border-domain-beer/40 shadow-[0_0_35px_rgba(251,191,36,0.15)]",
    iconColorClass: "text-domain-beer bg-domain-beer/10 border-domain-beer/30",
    taglineClass: "font-mono text-amber-300",
    btnClass: "text-slate-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    btnIconClass: "text-slate-900",
    gridColor: "rgba(245, 158, 11, 0.22)",
    ambientAuraClass: "from-amber-500/15 via-amber-950/5 to-transparent",
    isComingSoon: true,
    comingSoonText: "Próximamente (En desarrollo)",
    specs: [
      { label: "Modelo de Consumo", value: "Heurística de ingesta por perfil" },
      { label: "Moneda & Formato", value: "$ CLP exacto redondeado" },
      { label: "Integración", value: "Exportador de cuota para WhatsApp" }
    ]
  }
];
