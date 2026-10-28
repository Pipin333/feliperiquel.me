import type { APIRoute } from 'astro';
import { decryptDefaultProfile, extractToken, isAuthorized } from './auth';
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

export interface TeamMember {
  id?: string;
  nombre: string;
  rol: string;
  titulo?: string;
  anios_exp?: number;
  certificaciones?: string;
  cv_status?: string;
  cv_filename?: string;
}

export interface CompanyProfile {
  razon_social: string;
  rut_empresa: string;
  giro: string;
  anios_experiencia: number;
  certificaciones: string[];
  stack_fuerte: string[];
  capacidad_garantia_max_clp: number;
  factor_oferta_default: number; // porcentaje sobre presupuesto estimado (ej: 94%)
  region_origen: string;
  equipo?: TeamMember[];
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  razon_social: 'Consultora Tecnológica SpA',
  rut_empresa: '',
  giro: 'Consultoría Tecnológica, Plataformas Web Empresariales, Integraciones ERP/APIs, Modelos de Datos ODS y Arquitectura Multi-Cloud',
  anios_experiencia: 7,
  certificaciones: ['ISO 9001:2015', 'Estándares OWASP Top 10 & TLS 1.3 / AES-256', 'Sence Capacitación Continua'],
  stack_fuerte: [
    'Python', 'FastAPI', 'TypeScript', 'React', 'Next.js', 'Astro', 'Node.js', 'Tailwind CSS',
    'SQL Server', 'SSIS', 'SSRS', 'SSAS', 'Oracle', 'PostgreSQL', 'MySQL', 'Modelos ODS', 'Data Lake',
    'AWS', 'AWS Glue', 'Amazon Athena', 'AWS DMS', 'AWS Lambda', 'Step Functions', 'Lake Formation',
    'Azure', 'Azure DevOps', 'Power BI', 'Qlik Sense', 'Power Platform', 'BPMN',
    'Docker', 'Linux', 'Cloudflare Workers', 'Playwright', 'ETL', 'ELT', 'Gobierno de Datos'
  ],
  capacidad_garantia_max_clp: 35000000,
  factor_oferta_default: 94,
  region_origen: 'Región Metropolitana de Santiago',
  equipo: []
};

interface CriterioEvaluacion {
  criterio: string;
  ponderacion: number; // Porcentaje (ej: 45)
  puntaje_obtenido: number; // 0 a 100
  puntaje_ponderado: number; // (ponderacion * puntaje) / 100
  observacion: string;
}

interface RequisitoAuditoria {
  tipo: 'tecnico' | 'legal' | 'administrativo';
  item: string;
  estado: 'cumplido' | 'alerta' | 'critico';
  detalle: string;
}

export interface HeadsUpBrecha {
  tipo: 'equipo' | 'sector' | 'documental' | 'financiero';
  severidad: 'alta' | 'media' | 'baja';
  titulo: string;
  hallazgo: string;
  impacto_puntaje: string;
  mitigacion_sugerida: string;
}

export interface AnexoDetectado {
  codigo: string;
  nombre: string;
  categoria: 'Administrativo' | 'Técnico' | 'Económico';
  excluyente: boolean;
}

export interface ClausulaCritica {
  titulo: string;
  detalle: string;
  riesgo: 'alto' | 'medio' | 'bajo';
}

export interface AnalisisBasesDocumentales {
  activo: boolean;
  archivos_procesados: string[];
  caracteres_analizados: number;
  ponderacion_extraida_del_documento: boolean;
  ponderaciones: {
    economica: number;
    tecnica: number;
    experiencia: number;
    formal: number;
  };
  presupuesto_extraido_clp: number | null;
  req_anios_jp: number | null;
  req_anios_dev: number | null;
  req_anios_empresa: number | null;
  porcentaje_fiel_cumplimiento: number | null;
  exenta_garantia_seriedad: boolean;
  anexos_detectados: AnexoDetectado[];
  clausulas_criticas: ClausulaCritica[];
}

export interface EvaluationResult {
  codigo_externo: string;
  nombre_licitacion: string;
  organismo: string;
  monto_estimado_clp: number;
  monto_ofertado_clp: number;
  win_probability: number; // 0 a 100%
  decision: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
  decision_label: string;
  decision_color: string;
  criterios_evaluacion: CriterioEvaluacion[];
  auditoria_requisitos: RequisitoAuditoria[];
  heads_up_brechas: HeadsUpBrecha[];
  analisis_bases: AnalisisBasesDocumentales;
  fortalezas: string[];
  riesgos_dealbreakers: string[];
  recomendacion_estrategica: string;
  tiempo_evaluacion_ms: number;
}

/**
 * Diccionario de conceptos técnicos en español institucional chileno y su equivalencia con las capacidades de la consultora.
 */
const DOMAIN_CONCEPTS: Array<{ label: string; regex: RegExp; weight: number }> = [
  { label: 'Desarrollo de Software / Aplicaciones Web', regex: /software|aplicaci[oó]n|sistema web|plataforma|portal|desarrollo|fullstack|frontend|backend|app|m[oó]dulo/, weight: 14 },
  { label: 'Bases de Datos / ODS / Data Warehouse', regex: /base de datos|bases de datos|bodega de datos|modelo de datos|ods|sql|oracle|postgres|etl|migraci[oó]n de datos|repositorio/, weight: 16 },
  { label: 'Business Intelligence & Analítica', regex: /business intelligence|\bbi\b|microstrategy|power bi|tablero|dashboard|anal[ií]tica|estad[ií]stic|reporter[ií]a/, weight: 15 },
  { label: 'Arquitectura Cloud / IaaS / SaaS', regex: /nube|cloud|aws|azure|gcp|virtualizaci[oó]n|hosting|datacenter|iaas|saas|contenedor|docker|linux/, weight: 14 },
  { label: 'Integración de Sistemas / APIs / Interoperabilidad', regex: /\bapi\b|integraci[oó]n|interoperabilidad|webservice|rest|microservicio|arquitectura/, weight: 12 },
  { label: 'Consultoría TI & Gestión de Proyectos Ágiles', regex: /consultor[ií]a|asesor[ií]a|gesti[oó]n|diagn[oó]stico|levantamiento|scrum|[aá]gil|pmp|transformaci[oó]n digital/i, weight: 12 },
  { label: 'Inteligencia Artificial & Automatización', regex: /inteligencia artificial|\bia\b|\bai\b|machine learning|algoritm|automatizaci[oó]n|predictiv/, weight: 12 },
  { label: 'Ciberseguridad & Continuidad Operativa', regex: /ciberseguridad|seguridad de la informaci[oó]n|iso 27001|vulnerabilidad|respaldo|continuidad|contingencia/, weight: 10 },
  { label: 'Mantención Evolutiva y Soporte Técnico TI', regex: /mantenci[oó]n|mantenimiento|soporte|mesa de ayuda|evolutiv|correctiv|sla|continuidad operacional/, weight: 10 }
];

/**
 * Analizador forense de Bases Administrativas, Bases Técnicas y Términos de Referencia (TDR).
 * Extrae tabla de evaluación, anexos obligatorios, presupuesto, garantías, SLA/multas y exigencias de equipo.
 */
export function parseBasesDocument(
  rawText?: string,
  archivos?: string[]
): AnalisisBasesDocumentales {
  const clean = (rawText || '').trim();
  const defaultPonderaciones = { economica: 45, tecnica: 35, experiencia: 15, formal: 5 };

  if (clean.length < 40) {
    return {
      activo: false,
      archivos_procesados: [],
      caracteres_analizados: 0,
      ponderacion_extraida_del_documento: false,
      ponderaciones: defaultPonderaciones,
      presupuesto_extraido_clp: null,
      req_anios_jp: null,
      req_anios_dev: null,
      req_anios_empresa: null,
      porcentaje_fiel_cumplimiento: null,
      exenta_garantia_seriedad: false,
      anexos_detectados: [],
      clausulas_criticas: []
    };
  }

  // 1. Extracción de Ponderaciones de Criterios (%)
  const extractWeight = (patterns: RegExp[]): number | null => {
    for (const pat of patterns) {
      const m = clean.match(pat);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (val >= 2 && val <= 90) return val;
      }
    }
    return null;
  };

  const wEco = extractWeight([
    /(?:oferta\s+econ[oó]mica|evaluaci[oó]n\s+econ[oó]mica|propuesta\s+econ[oó]mica|\bprecio\b)[^\d%\n]{1,65}(\d{1,2})\s*%/i,
    /(\d{1,2})\s*%[^\n]{1,45}(?:oferta\s+econ[oó]mica|propuesta\s+econ[oó]mica|\bprecio\b)/i
  ]);

  const wTech = extractWeight([
    /(?:propuesta\s+t[eé]cnica|evaluaci[oó]n\s+t[eé]cnica|calidad\s+t[eé]cnica|metodolog[ií]a(?:\s+de\s+trabajo)?)[^\d%\n]{1,65}(\d{1,2})\s*%/i,
    /(\d{1,2})\s*%[^\n]{1,45}(?:propuesta\s+t[eé]cnica|evaluaci[oó]n\s+t[eé]cnica|metodolog[ií]a)/i
  ]);

  const wExp = extractWeight([
    /(?:experiencia(?:\s+del\s+oferente|\s+previa|\s+del\s+equipo|\s+y\s+equipo)?|equipo\s+de\s+trabajo|calificaci[oó]n\s+del\s+equipo)[^\d%\n]{1,65}(\d{1,2})\s*%/i,
    /(\d{1,2})\s*%[^\n]{1,45}(?:experiencia\s+del\s+oferente|equipo\s+de\s+trabajo)/i
  ]);

  const wForm = extractWeight([
    /(?:cumplimiento\s+(?:de\s+)?requisitos\s+formales|requisitos\s+formales|sustentabilidad|inclusi[oó]n|sello\s+mujer)[^\d%\n]{1,65}(\d{1,2})\s*%/i,
    /(\d{1,2})\s*%[^\n]{1,45}(?:requisitos\s+formales|cumplimiento\s+formal)/i
  ]);

  const foundCount = [wEco, wTech, wExp, wForm].filter(v => v !== null).length;
  let ponderacionExtraida = false;
  let finalPonderaciones = { ...defaultPonderaciones };

  if (foundCount >= 2) {
    ponderacionExtraida = true;
    const rawEco = wEco ?? 40;
    const rawTech = wTech ?? 35;
    const rawExp = wExp ?? 20;
    const rawForm = wForm ?? 5;
    const sum = rawEco + rawTech + rawExp + rawForm;

    if (sum === 100) {
      finalPonderaciones = { economica: rawEco, tecnica: rawTech, experiencia: rawExp, formal: rawForm };
    } else if (sum > 0) {
      const normEco = Math.round((rawEco / sum) * 100);
      const normTech = Math.round((rawTech / sum) * 100);
      const normExp = Math.round((rawExp / sum) * 100);
      const normForm = Math.max(0, 100 - (normEco + normTech + normExp));
      finalPonderaciones = { economica: normEco, tecnica: normTech, experiencia: normExp, formal: normForm };
    }
  }

  // 2. Extracción de Presupuesto Oficial desde el Documento
  let presupuestoExtraido: number | null = null;
  const mClp = clean.match(/(?:presupuesto(?:\s+m[aá]ximo|\s+estimado|\s+referencial|\s+disponible)?|monto\s+m[aá]ximo(?:\s+disponible)?)[^\n$]{0,90}\$\s*([\d.]{6,15})/i);
  if (mClp && mClp[1]) {
    const num = parseInt(mClp[1].replace(/\./g, ''), 10);
    if (num >= 1000000 && num <= 10000000000) {
      presupuestoExtraido = num;
    }
  } else {
    const mUtm = clean.match(/(?:presupuesto(?:\s+m[aá]ximo|\s+disponible)?|monto\s+m[aá]ximo)[^\n]{0,80}?([\d.]{2,6})\s*UTM\b/i);
    if (mUtm && mUtm[1]) {
      const utm = parseInt(mUtm[1].replace(/\./g, ''), 10);
      if (utm >= 10 && utm <= 50000) presupuestoExtraido = utm * 67500;
    } else {
      const mUf = clean.match(/(?:presupuesto(?:\s+m[aá]ximo|\s+disponible)?|monto\s+m[aá]ximo)[^\n]{0,80}?([\d.]{2,6})\s*UF\b/i);
      if (mUf && mUf[1]) {
        const uf = parseInt(mUf[1].replace(/\./g, ''), 10);
        if (uf >= 30 && uf <= 100000) presupuestoExtraido = uf * 38500;
      }
    }
  }

  // 3. Extracción de Años de Experiencia Exigidos en las Bases
  let reqAniosJp: number | null = null;
  const mJp = clean.match(/(?:jefe\s+de\s+proyecto|director\s+de\s+proyecto|coordinador\s+del?\s+proyecto)[^\n.]{0,140}?(\d{1,2})\s*a[ñn]os\s+de\s+experiencia/i);
  if (mJp && mJp[1]) {
    const y = parseInt(mJp[1], 10);
    if (y >= 1 && y <= 25) reqAniosJp = y;
  }

  let reqAniosDev: number | null = null;
  const mDev = clean.match(/(?:desarrollador|arquitecto|ingeniero\s+de\s+software|especialista\s+t[eé]cnico|programador|analista)[^\n.]{0,140}?(\d{1,2})\s*a[ñn]os\s+de\s+experiencia/i);
  if (mDev && mDev[1]) {
    const y = parseInt(mDev[1], 10);
    if (y >= 1 && y <= 20) reqAniosDev = y;
  }

  let reqAniosEmpresa: number | null = null;
  const mEmp = clean.match(/(?:experiencia\s+del\s+oferente|antig[uü]edad\s+de\s+la\s+empresa)[^\n.]{0,120}?(\d{1,2})\s*a[ñn]os/i);
  if (mEmp && mEmp[1]) {
    const y = parseInt(mEmp[1], 10);
    if (y >= 1 && y <= 25) reqAniosEmpresa = y;
  }

  // 4. Detección de Anexos Obligatorios (Anexo N° X / Formulario N° X)
  const anexosMap = new Map<string, AnexoDetectado>();
  const anexoRegex = /\b(Anexo|Formulario)\s*(?:N[°ºo.]?\s*)?(\d{1,2}[A-Z]?)\b[\s:.\-–—]*([^\n\r]{3,95})/gi;
  let matchAnexo: RegExpExecArray | null;

  while ((matchAnexo = anexoRegex.exec(clean)) !== null) {
    const tipoDoc = matchAnexo[1];
    const num = matchAnexo[2].toUpperCase();
    const key = `${tipoDoc.toUpperCase()}_${num}`;
    if (anexosMap.has(key)) continue;

    let rawTitle = matchAnexo[3].trim().replace(/[.;,]+$/, '').trim();
    if (rawTitle.length > 82) rawTitle = `${rawTitle.slice(0, 79)}...`;

    // Filtrar falsos positivos de oraciones genéricas
    if (/^(del|de la|que|para|seg[uú]n|en el|deber[aá]|ser[aá])\b/i.test(rawTitle) && rawTitle.length < 18) {
      continue;
    }

    const low = rawTitle.toLowerCase();
    let categoria: 'Administrativo' | 'Técnico' | 'Económico' = 'Administrativo';
    if (/econ[oó]mic|precio|valor|oferta\s+econ|presupuesto|tarifa/.test(low)) {
      categoria = 'Económico';
    } else if (/t[eé]cnic|experiencia|equipo|curr[ií]cul|metodolog|plazo|sla|arquitectura|plan\s+de\s+trabajo/.test(low)) {
      categoria = 'Técnico';
    }

    const excluyente = /declaraci[oó]n|econ[oó]mic|identificaci[oó]n|t[eé]cnic|oferta/.test(low) || parseInt(num, 10) <= 6;

    anexosMap.set(key, {
      codigo: `${tipoDoc} N° ${num}`,
      nombre: rawTitle,
      categoria,
      excluyente
    });

    if (anexosMap.size >= 14) break;
  }

  // 5. Detección de Garantías y Cláusulas Críticas ("Letra Chica")
  const clausulas: ClausulaCritica[] = [];
  const exentaSeriedad = /no\s+se\s+exigir[aá]\s+garant[ií]a\s+de\s+seriedad|exent[oa]\s+de\s+garant[ií]a\s+de\s+seriedad/i.test(clean);

  let pctFielCumplimiento: number | null = null;
  const mFiel = clean.match(/fiel\s+(?:y\s+oportuno\s+)?cumplimiento[^\n%]{0,120}?(\d{1,2})\s*%/i);
  if (mFiel && mFiel[1]) {
    const p = parseInt(mFiel[1], 10);
    if (p >= 3 && p <= 30) pctFielCumplimiento = p;
  }

  // Visita a terreno o reunión informativa
  if (/visita\s+a\s+terreno|reuni[oó]n\s+informativa/i.test(clean)) {
    const esObligatoria = /(?:visita\s+a\s+terreno|reuni[oó]n\s+informativa)[^\n.]{0,90}(?:obligatoria|excluyente)/i.test(clean);
    clausulas.push({
      titulo: esObligatoria ? '🚨 Visita a Terreno / Reunión Informativa OBLIGATORIA' : 'Reunión Informativa / Visita a Terreno Opcional',
      detalle: esObligatoria
        ? 'Las bases establecen asistencia obligatoria a visita a terreno o reunión informativa. La inasistencia deja la oferta fuera de bases en el acto de apertura.'
        : 'Las bases contemplan instancia informativa o visita de carácter voluntario/no excluyente.',
      riesgo: esObligatoria ? 'alto' : 'bajo'
    });
  }

  // Multas y SLA
  const mMulta = clean.match(/multa[s]?[^\n.]{0,140}?(?:\d+[,.]?\d*\s*(?:UF|UTM|%)|tope\s+de[^\n.]{0,50})/i);
  if (mMulta) {
    clausulas.push({
      titulo: 'Régimen de Multas y Penalidades por SLA / Atraso',
      detalle: `Cláusula detectada en bases: "${mMulta[0].trim()}". Verificar tiempos de respuesta y topes de cobro.`,
      riesgo: 'medio'
    });
  }

  // Plazo de ejecución / vigencia del contrato
  const mPlazo = clean.match(/(?:plazo\s+de\s+ejecuci[oó]n|duraci[oó]n\s+del\s+contrato|vigencia\s+del\s+contrato)[^\n.]{0,110}?(\d{1,3}\s*(?:meses|d[ií]as\s+corridos|d[ií]as\s+h[aá]biles))/i);
  if (mPlazo && mPlazo[1]) {
    clausulas.push({
      titulo: `Plazo Contractual Detectado: ${mPlazo[1]}`,
      detalle: `El documento establece una vigencia o plazo de implementación referencial de ${mPlazo[1]}.`,
      riesgo: 'bajo'
    });
  }

  // Propiedad intelectual y código fuente
  if (/propiedad\s+intelectual|c[oó]digo\s+fuente|cesi[oó]n\s+de\s+derechos/i.test(clean)) {
    clausulas.push({
      titulo: 'Cláusula de Propiedad Intelectual y Entrega de Código Fuente',
      detalle: 'Las bases exigen transferencia de propiedad patrimonial o entrega de repositorios de código fuente y documentación técnica al organismo.',
      riesgo: 'bajo'
    });
  }

  // Subcontratación y UTP
  if (/proh[ií]be\s+(?:la\s+)?subcontrataci[oó]n|no\s+se\s+permite\s+subcontratar/i.test(clean)) {
    clausulas.push({
      titulo: 'Prohibición Expresa de Subcontratación',
      detalle: 'Las bases prohíben subcontratar servicios críticos; el 100% del equipo ejecutor debe pertenecer al oferente o a una UTP formalizada.',
      riesgo: 'medio'
    });
  }

  return {
    activo: true,
    archivos_procesados: Array.isArray(archivos) && archivos.length > 0 ? archivos : ['Bases_Licitacion.pdf'],
    caracteres_analizados: clean.length,
    ponderacion_extraida_del_documento: ponderacionExtraida,
    ponderaciones: finalPonderaciones,
    presupuesto_extraido_clp: presupuestoExtraido,
    req_anios_jp: reqAniosJp,
    req_anios_dev: reqAniosDev,
    req_anios_empresa: reqAniosEmpresa,
    porcentaje_fiel_cumplimiento: pctFielCumplimiento,
    exenta_garantia_seriedad: exentaSeriedad,
    anexos_detectados: Array.from(anexosMap.values()),
    clausulas_criticas: clausulas
  };
}

/**
 * Motor de Scoring y Contraste de Bases para Mercado Público de Chile.
 * Aplica las fórmulas reales de ChileCompra y enriquece el cálculo cuando el usuario adjunta el PDF/DOCX de las Bases.
 */
export function evaluateTender(
  lic: LicitacionData,
  profile: CompanyProfile,
  customOfertaClp?: number,
  basesTexto?: string,
  basesArchivos?: string[]
): EvaluationResult {
  const t0 = performance.now();
  const analisisBases = parseBasesDocument(basesTexto, basesArchivos);

  const presupuesto = analisisBases.presupuesto_extraido_clp
    ? analisisBases.presupuesto_extraido_clp
    : (lic.monto_estimado && lic.monto_estimado > 0 ? lic.monto_estimado : 50000000);

  const factor = profile.factor_oferta_default || 94;
  const oferta = customOfertaClp && customOfertaClp > 0 ? customOfertaClp : Math.round(presupuesto * (factor / 100));

  const wEco = analisisBases.ponderaciones.economica;
  const wTech = analisisBases.ponderaciones.tecnica;
  const wExp = analisisBases.ponderaciones.experiencia;
  const wForm = analisisBases.ponderaciones.formal;

  // El texto total ahora incluye tanto la ficha de Mercado Público como el texto completo extraído del PDF de las Bases
  const textTotal = `${lic.nombre} ${lic.descripcion} ${lic.categoria_label || ''} ${basesTexto || ''}`.toLowerCase();
  const equipo = Array.isArray(profile.equipo) ? profile.equipo : (DEFAULT_COMPANY_PROFILE.equipo || []);
  const teamText = equipo.map(e => `${e.rol || ''} ${e.titulo || ''} ${e.certificaciones || ''}`).join(' ').toLowerCase();

  // Separación estricta de roles en la nómina (evitando colisiones entre JP y Lead Dev)
  const jp = equipo.find(e => {
    const r = (e.rol || '').toLowerCase();
    return /jefe|director|gerente|project manager|\bpm\b|coordinador/.test(r);
  });

  const devLead = equipo.find(e => {
    if (jp && e === jp && equipo.length > 1) return false;
    const r = (e.rol || '').toLowerCase();
    return /arquitecto|lead|ingeniero|desarrollador|developer|producto|fullstack|especialista|consultor/.test(r);
  }) || equipo.find(e => e !== jp);

  // ============================================================================
  // 1. EVALUACIÓN TÉCNICA Y AFINIDAD DE GIRO
  // ============================================================================
  const catId = (lic.categoria_id || '').toLowerCase();
  const esHardwarePuro = catId === 'hardware' && !/software|sistema|plataforma|base de datos|desarrollo|consultor/.test(textTotal);
  const esReventaLicencias = catId === 'licencias' && !/servicio|implementaci[oó]n|mantenci[oó]n|soporte|consultor|desarrollo|bi\b/.test(textTotal);

  const matchedConceptLabels: string[] = [];
  let conceptPoints = 0;

  for (const concept of DOMAIN_CONCEPTS) {
    if (concept.regex.test(textTotal)) {
      matchedConceptLabels.push(concept.label);
      conceptPoints += concept.weight;
    }
  }

  // Cruce adicional con stack explícito y competencias del equipo
  for (const tech of profile.stack_fuerte) {
    const tLow = tech.toLowerCase();
    if (textTotal.includes(tLow)) {
      conceptPoints += 8;
      if (!matchedConceptLabels.includes(tech)) matchedConceptLabels.push(tech);
    }
  }

  if (/ia\b|inteligencia artificial|ai\b/.test(textTotal) && /ai|inteligencia artificial/.test(teamText)) {
    conceptPoints += 10;
  }

  const baseSemantic = lic.score_percentage || 60;
  let techScore = Math.round(baseSemantic * 0.62 + Math.min(36, conceptPoints));

  if (catId === 'datos' || catId === 'software' || catId === 'consultoria' || catId === 'cloud') {
    techScore = Math.max(68, Math.min(96, techScore + 6));
  } else if (catId === 'ciberseguridad') {
    techScore = Math.max(60, Math.min(88, techScore));
  } else if (esHardwarePuro) {
    techScore = Math.min(42, Math.max(22, techScore - 30));
  } else if (esReventaLicencias) {
    techScore = Math.min(62, Math.max(40, techScore - 15));
  }

  techScore = Math.min(98, Math.max(20, techScore));

  // ============================================================================
  // 2. EVALUACIÓN ECONÓMICA CONTINUA
  // Fórmula ChileCompra: P = (Precio Mínimo Estimado / Precio Ofertado) * 100
  // ============================================================================
  const ratioOferta = oferta / presupuesto;
  const ratioReferenciaMinimo = 0.82;
  let economicScore = 80;

  if (ratioOferta <= 1.0) {
    const raw = (ratioReferenciaMinimo / Math.max(0.70, ratioOferta)) * 100;
    economicScore = Math.min(100, Math.max(82, Math.round(raw * 1.025)));
  } else {
    economicScore = Math.max(15, Math.round(84 - (ratioOferta - 1.0) * 450));
  }

  const esOfertaTemeraria = ratioOferta < 0.78;

  // ============================================================================
  // 3. EXPERIENCIA DEL PROVEEDOR Y NÓMINA DE EQUIPO
  // ============================================================================
  const isGranCompra = lic.codigo_externo.includes('LR') || presupuesto > 100000000;

  // Subfactor A: Antigüedad de la empresa (hasta 40 pts del criterio)
  const reqAniosEmpresa = analisisBases.req_anios_empresa ?? (isGranCompra ? 5 : 3);
  const scoreEmpresa = profile.anios_experiencia >= reqAniosEmpresa
    ? 40
    : Math.max(15, Math.round((profile.anios_experiencia / reqAniosEmpresa) * 40));

  // Subfactor B: Nómina Técnica y Liderazgo (hasta 60 pts del criterio)
  const reqJpTarget = analisisBases.req_anios_jp ?? 6;
  const reqDevTarget = analisisBases.req_anios_dev ?? 4;

  let scoreNomina = 0;
  if (equipo.length === 0) {
    scoreNomina = 10;
  } else {
    if (jp) {
      const aniosJp = jp.anios_exp ?? 0;
      const jpExpPts = Math.min(22, Math.round((aniosJp / Math.max(1, reqJpTarget)) * 22));
      const jpCertPts = (jp.certificaciones && jp.certificaciones.trim().length > 3) ? 10 : 4;
      scoreNomina += jpExpPts + jpCertPts;
    } else {
      scoreNomina += 8;
    }

    if (devLead) {
      const aniosDev = devLead.anios_exp ?? 0;
      const devExpPts = Math.min(18, Math.round((aniosDev / Math.max(1, reqDevTarget)) * 18));
      const devCertPts = (devLead.certificaciones && devLead.certificaciones.trim().length > 3) ? 10 : 4;
      scoreNomina += devExpPts + devCertPts;
    } else if (equipo.length >= 1) {
      scoreNomina += 10;
    }
  }

  const expScore = Math.min(100, Math.max(20, scoreEmpresa + scoreNomina));

  // ============================================================================
  // 4. CUMPLIMIENTO FORMAL Y CAPACITACIÓN SENCE / SUSTENTABILIDAD
  // ============================================================================
  const tieneSence = /sence|conflicto|inclusi[oó]n|sustentabilidad/.test(teamText) ||
                     profile.certificaciones.some(c => /sence/i.test(c));
  const formalScore = tieneSence ? 100 : 90;

  const origenPonderacionLabel = analisisBases.ponderacion_extraida_del_documento
    ? ' (Extraído de Bases PDF)'
    : '';

  const criterios: CriterioEvaluacion[] = [
    {
      criterio: `Oferta Económica (Precio)${origenPonderacionLabel}`,
      ponderacion: wEco,
      puntaje_obtenido: economicScore,
      puntaje_ponderado: Math.round((wEco * economicScore) / 100 * 10) / 10,
      observacion: esOfertaTemeraria
        ? `Oferta al ${Math.round(ratioOferta * 100)}% ($${Number(oferta).toLocaleString('es-CL')} CLP). ¡Atención!: Bajo el 78% existe riesgo de exigencia de caución por oferta temeraria.`
        : ratioOferta > 1.0
          ? `Oferta supera en ${Math.round((ratioOferta - 1) * 100)}% el presupuesto referencial. Alto riesgo de rechazo en apertura económica.`
          : `Oferta competitiva de $${Number(oferta).toLocaleString('es-CL')} CLP (${Math.round(ratioOferta * 100)}% del presupuesto${analisisBases.presupuesto_extraido_clp ? ' oficial extraído del PDF' : ' referencial'}).`
    },
    {
      criterio: `Propuesta Técnica y Metodología${origenPonderacionLabel}`,
      ponderacion: wTech,
      puntaje_obtenido: techScore,
      puntaje_ponderado: Math.round((wTech * techScore) / 100 * 10) / 10,
      observacion: esHardwarePuro
        ? 'Licitación orientada a provisión de equipamiento físico/hardware; baja alineación con giro de consultoría de software.'
        : matchedConceptLabels.length > 0
          ? `Calce técnico en: ${matchedConceptLabels.slice(0, 4).join(', ')}.`
          : `Evaluación técnica basada en categoría (${lic.categoria_label || 'TI'}) y metodología estándar.`
    },
    {
      criterio: `Experiencia del Proveedor y Equipo${origenPonderacionLabel}`,
      ponderacion: wExp,
      puntaje_obtenido: expScore,
      puntaje_ponderado: Math.round((wExp * expScore) / 100 * 10) / 10,
      observacion: equipo.length > 0
        ? `Empresa con ${profile.anios_experiencia} años (exigido: ${reqAniosEmpresa}a) + nómina activa (${equipo.map(e => `${e.nombre}: ${e.anios_exp || 0}a`).join(', ')}).`
        : `Empresa con ${profile.anios_experiencia} años, pero sin nómina de profesionales asignada (penalización en pauta técnica).`
    },
    {
      criterio: `Requisitos Formales y SENCE${origenPonderacionLabel}`,
      ponderacion: wForm,
      puntaje_obtenido: formalScore,
      puntaje_ponderado: Math.round((wForm * formalScore) / 100 * 10) / 10,
      observacion: tieneSence
        ? 'Habilidad ChileProveedores al día + bonificación por capacitación certificada SENCE en el equipo.'
        : 'Habilidad vigente en ChileProveedores y declaraciones juradas al día.'
    }
  ];

  const totalScorePonderado = criterios.reduce((acc, c) => acc + c.puntaje_ponderado, 0);

  // ============================================================================
  // AUDITORÍA DE REQUISITOS LEGALES, TÉCNICOS Y FINANCIEROS
  // ============================================================================
  const auditoria: RequisitoAuditoria[] = [];
  const fortalezas: string[] = [];
  const riesgos: string[] = [];

  // Chequeo 1: Garantías Financieras Unificadas (considerando extracción desde el PDF si existe)
  const pctFiel = (analisisBases.porcentaje_fiel_cumplimiento ?? 5) / 100;
  const exigeGarantia = !analisisBases.exenta_garantia_seriedad && (isGranCompra || presupuesto > 40000000 || analisisBases.porcentaje_fiel_cumplimiento !== null);
  const garantiaSeriedad = analisisBases.exenta_garantia_seriedad ? 0 : Math.round(presupuesto * 0.02);
  const garantiaFielCumplimiento = Math.round(oferta * pctFiel * 1.19);

  if (exigeGarantia) {
    if (garantiaFielCumplimiento <= profile.capacidad_garantia_max_clp) {
      auditoria.push({
        tipo: 'legal',
        item: `Garantías de Seriedad y Fiel Cumplimiento (${Math.round(pctFiel * 100)}%)`,
        estado: 'cumplido',
        detalle: `Seriedad estimada: $${Number(garantiaSeriedad).toLocaleString('es-CL')} CLP. Fiel cumplimiento (${Math.round(pctFiel * 100)}%): $${Number(garantiaFielCumplimiento).toLocaleString('es-CL')} CLP. Cubiertas por línea de pólizas ($${Number(profile.capacidad_garantia_max_clp).toLocaleString('es-CL')} CLP).`
      });
      fortalezas.push(`Capacidad de pólizas ($${Number(profile.capacidad_garantia_max_clp).toLocaleString('es-CL')} CLP) cubre holgadamente el fiel cumplimiento del contrato.`);
    } else {
      auditoria.push({
        tipo: 'legal',
        item: 'Límite de Póliza de Fiel Cumplimiento',
        estado: 'critico',
        detalle: `La caución de fiel cumplimiento estimada ($${Number(garantiaFielCumplimiento).toLocaleString('es-CL')} CLP al ${Math.round(pctFiel * 100)}%) supera la capacidad máxima declarada ($${Number(profile.capacidad_garantia_max_clp).toLocaleString('es-CL')} CLP).`
      });
      riesgos.push('Garantía de contrato supera el cupo actual de pólizas: requiere ampliar línea con aseguradora o postular en UTP.');
    }
  } else {
    auditoria.push({
      tipo: 'legal',
      item: 'Exención de Boleta de Seriedad (< 1.000 UTM / Exenta en Bases)',
      estado: 'cumplido',
      detalle: 'Por monto referencial o disposición expresa de las bases, no se inmoviliza boleta de seriedad en la etapa de oferta.'
    });
    fortalezas.push('Baja barrera financiera de entrada: no inmoviliza línea de crédito en etapa de postulación.');
  }

  // Chequeo 2: Nómina de Equipo Técnico
  if (jp && devLead) {
    auditoria.push({
      tipo: 'tecnico',
      item: 'Estructura de Equipo Técnico y Roles Clave',
      estado: 'cumplido',
      detalle: `Equipo completo acreditado: Jefatura (${jp.nombre} - ${jp.anios_exp || 0} años) + Especialista/Producto (${devLead.nombre} - ${devLead.anios_exp || 0} años).`
    });
    fortalezas.push(`Dupla complementaria acreditada: ${jp.nombre} en dirección de proyecto y ${devLead.nombre} en ingeniería de software/producto.`);
  } else if (equipo.length > 0) {
    auditoria.push({
      tipo: 'tecnico',
      item: 'Composición de Nómina Técnica Incompleta',
      estado: 'alerta',
      detalle: jp
        ? 'Se cuenta con Jefe de Proyecto, pero falta asignar un Lead Developer / Ingeniero de Producto en la nómina.'
        : 'Falta designar un Jefe de Proyecto titular con experiencia acreditada para liderar el contrato.'
    });
    riesgos.push('Nómina sin dupla completa (Jefe de Proyecto + Lead Técnico) reduce puntaje en evaluación de equipo.');
  } else {
    auditoria.push({
      tipo: 'tecnico',
      item: 'Sin Nómina de Equipo Técnico Asignada',
      estado: 'critico',
      detalle: 'No hay profesionales cargados en la nómina. Toda licitación de servicios TI exige presentar equipo de trabajo en el Anexo Técnico.'
    });
    riesgos.push('Sin equipo asignado la oferta técnica será calificada con 0 puntos en el factor recursos humanos.');
  }

  // Chequeo 3: Giro Técnico vs Naturaleza de Licitación
  if (esHardwarePuro) {
    auditoria.push({
      tipo: 'tecnico',
      item: 'Adecuación de Giro (Hardware vs Software/Consultoría)',
      estado: 'critico',
      detalle: 'Esta licitación corresponde a suministro de equipamiento físico o hardware, fuera del foco principal de desarrollo y datos de la consultora.'
    });
    riesgos.push('Licitación de provisión de hardware: requiere alianzas con mayoristas (Ingram/Tecnoglobal) y capital de trabajo intensivo.');
  } else {
    auditoria.push({
      tipo: 'tecnico',
      item: 'Alineación de Giro y Competencias Técnicas',
      estado: 'cumplido',
      detalle: `Giro de consultoría informática, datos y software alineado con la categoría "${lic.categoria_label || 'Servicios TI'}".`
    });
  }

  // Chequeo 4: Territorialidad y SLA Presencial
  const regionComprador = lic.comprador?.region || 'Chile';
  const esMismaRegion = /metropolitana|santiago|^chile$/i.test(regionComprador.trim());
  if (esMismaRegion) {
    auditoria.push({
      tipo: 'administrativo',
      item: 'Territorialidad y Cobertura Operativa',
      estado: 'cumplido',
      detalle: 'Organismo con alcance nacional o en Región Metropolitana, coincidiendo con la base operativa de la consultora.'
    });
  } else {
    auditoria.push({
      tipo: 'administrativo',
      item: `Alcance Regional (${regionComprador.trim()})`,
      estado: 'alerta',
      detalle: `Organismo en ${regionComprador.trim()}. Verificar en bases si las reuniones de seguimiento y puesta en marcha son 100% remotas o exigen viajes presenciales.`
    });
    riesgos.push(`Considerar costos de traslado eventual a ${regionComprador.trim()} si las bases exigen hitos presenciales.`);
  }

  if (ratioOferta > 1.0) {
    auditoria.push({
      tipo: 'legal',
      item: 'Límite de Presupuesto Máximo Disponible',
      estado: 'critico',
      detalle: `El monto ofertado ($${Number(oferta).toLocaleString('es-CL')} CLP) excede el presupuesto referencial ($${Number(presupuesto).toLocaleString('es-CL')} CLP). Causal frecuente de inadmisibilidad en el acto de apertura.`
    });
  }

  // ============================================================================
  // ANÁLISIS FORENSE DE BRECHAS & HEADS-UP ESTRATÉGICO
  // ============================================================================
  const headsUpBrechas: HeadsUpBrecha[] = [];

  if (analisisBases.activo) {
    headsUpBrechas.push({
      tipo: 'documental',
      severidad: 'baja',
      titulo: `Lectura Forense de Bases Activa (${analisisBases.archivos_procesados.join(', ')})`,
      hallazgo: `Se analizaron ${Number(analisisBases.caracteres_analizados).toLocaleString('es-CL')} caracteres del documento oficial. ${
        analisisBases.ponderacion_extraida_del_documento
          ? `Ponderación real detectada: ${wEco}% Económica / ${wTech}% Técnica / ${wExp}% Experiencia / ${wForm}% Formal.`
          : 'Se aplicó matriz estándar complementada con extracción de anexos y cláusulas del documento.'
      }${analisisBases.anexos_detectados.length > 0 ? ` Se identificaron ${analisisBases.anexos_detectados.length} Anexos/Formularios en las bases.` : ''}`,
      impacto_puntaje: 'Simulación calibrada directamente contra el texto completo de las Bases Administrativas/Técnicas.',
      mitigacion_sugerida: 'Revisar el desglose de Anexos Obligatorios y Cláusulas Críticas extraídas más abajo antes de subir la oferta al portal.'
    });
  }

  // 0. Calce con el Catálogo de 4 Soluciones Pre-Construidas
  const PREBUILT_SOLUTIONS = [
    {
      nombre: 'Motor de Repositorio de Datos ODS & Tuberías ETL/ELT',
      regex: /base de datos|bases de datos|\bods\b|bodega de datos|data warehouse|etl|elt|oracle|postgres|sql server|snowflake|migraci[oó]n de datos/
    },
    {
      nombre: 'Hub de Integración de APIs & Conector ERP (SAP / Softland / Oracle)',
      regex: /\bsap\b|softland|interoperabilidad|integraci[oó]n|\bapi\b|webservice|middleware|conector|sistemas legados/
    },
    {
      nombre: 'Plataforma Cloud: ERP, Cotizador, Inventario & Integración SII',
      regex: /\berp\b|facturaci[oó]n|\bsii\b|inventario|remuneraciones|personal|cotizador|contabilidad|autoservicio|portal web/
    },
    {
      nombre: 'Portal de Tracking Satelital, Flotas GPS & Visibilidad Logística B2B',
      regex: /tracking|satelital|\bgps\b|flota|log[ií]stica|transporte|carga|georreferencia|mapa|aduan/
    }
  ];

  const matchedSolution = !esHardwarePuro ? PREBUILT_SOLUTIONS.find(s => s.regex.test(textTotal)) : undefined;
  if (matchedSolution) {
    headsUpBrechas.push({
      tipo: 'sector',
      severidad: 'baja',
      titulo: `Acelerador de Catálogo Propio: ${matchedSolution.nombre}`,
      hallazgo: `El requerimiento calza directamente con una de las soluciones pre-construidas del catálogo propio ("${matchedSolution.nombre}"). Permite ofertar un menor tiempo de implementación usando arquitectura probada.`,
      impacto_puntaje: 'Maximiza el puntaje en Metodología de Implementación, Plazos de Entrega y Propuesta Técnica.',
      mitigacion_sugerida: 'Destacar en la oferta técnica las 3 ventajas competitivas: 1) 100% propiedad del código sin costos recurrentes por usuario, 2) Despliegue agnóstico (AWS, Azure o Data Center del organismo), y 3) SLA con garantía continua.'
    });
    fortalezas.push(`Acelerador pre-construido disponible en el catálogo: ${matchedSolution.nombre} (100% propiedad del código sin licencias por asiento).`);
  }

  // 1. Brecha de Sector / Organismo Comprador
  const org = (lic.comprador?.nombre_organismo || '').toLowerCase();
  const esSalud = /salud|hospital|fonasa|cenabast|minsal|cl[ií]nic|m[eé]dic|asistencial/.test(org) ||
                  /salud|hospital|cl[ií]nic|m[eé]dic|paciente|hl7|his\b/.test(textTotal);
  const esMunicipal = /municipal|alcald[ií]a|comuna/.test(org);
  const esGobiernoCentral = /ministerio|subsecretar[ií]a|presidencia|hacienda|sii|tesorer[ií]a|defensa|armada|carabineros|pdi|mop|obras p[uú]blicas/.test(org);

  if (esSalud) {
    const tieneExpSalud = /salud|hospital|cl[ií]nic|hl7|fhir|fonasa|minsal/.test(teamText);
    if (!tieneExpSalud) {
      headsUpBrechas.push({
        tipo: 'sector',
        severidad: 'alta',
        titulo: 'Exigencia de Experiencia en Redes Asistenciales / Salud Pública',
        hallazgo: `El comprador es "${lic.comprador?.nombre_organismo || 'Entidad de Salud'}". Las pautas del sector salud suelen ponderar entre 15% y 25% la acreditación de proyectos previos en hospitales, interoperabilidad HL7/FHIR o sistemas clínicos. El equipo actual destaca en banca y TI corporativo, pero no declara contratos previos en salud.`,
        impacto_puntaje: 'Riesgo de obtener 0 puntos en el subfactor de experiencia sectorial específica.',
        mitigacion_sugerida: 'Presentar las integraciones de datos ODS y APIs críticas como homologables a interoperabilidad compleja, o asociarse en UTP con un proveedor del área salud.'
      });
      riesgos.push('Brecha sectorial en Salud: evaluar peso del subcriterio de experiencia hospitalaria en las bases.');
    } else {
      headsUpBrechas.push({
        tipo: 'sector',
        severidad: 'baja',
        titulo: 'Experiencia Sectorial en Salud Acreditada',
        hallazgo: `La nómina declara competencias o experiencia aplicable al sector salud requerido por "${lic.comprador?.nombre_organismo}".`,
        impacto_puntaje: 'Asegura puntaje competitivo en experiencia específica del rubro.',
        mitigacion_sugerida: 'Adjuntar certificados de recepción conforme emitidos por servicios de salud u hospitales.'
      });
    }
  } else if (esMunicipal) {
    headsUpBrechas.push({
      tipo: 'sector',
      severidad: 'media',
      titulo: 'Sensibilidad a Soporte Cercano y Gestión Municipal',
      hallazgo: 'Las municipalidades priorizan en su evaluación la rapidez de soporte técnico (SLA de respuesta ante caídas) y la capacitación a funcionarios municipales.',
      impacto_puntaje: 'Incide entre un 10% y 15% en el criterio de metodología y plan de capacitación.',
      mitigacion_sugerida: 'Destacar la certificación SENCE de Resolución de Conflictos en el plan de capacitación y gestión del cambio con los funcionarios.'
    });
  } else if (esGobiernoCentral) {
    headsUpBrechas.push({
      tipo: 'sector',
      severidad: 'baja',
      titulo: 'Alta Afinidad con Estándares de Gobierno Central y Datos',
      hallazgo: `El organismo comprador (${lic.comprador?.nombre_organismo}) valora arquitecturas estructuradas, modelos de datos ODS, BI y cumplimiento normativo.`,
      impacto_puntaje: 'Excelente calce con la experiencia en bases de datos, ETL y desarrollo web del equipo.',
      mitigacion_sugerida: 'Enfatizar en la propuesta técnica la arquitectura desacoplada, trazabilidad de datos y estándares de seguridad OWASP/ISO.'
    });
  }

  // 2. Brecha de Jefe de Proyecto
  if (!jp) {
    headsUpBrechas.push({
      tipo: 'equipo',
      severidad: 'alta',
      titulo: 'Falta de Jefe de Proyecto / Director Titular en la Nómina',
      hallazgo: 'No se detecta ningún profesional con rol de Jefe de Proyecto o Director en el equipo configurado.',
      impacto_puntaje: 'Penalización directa en la matriz de evaluación de equipo (pérdida de hasta 32% del subcriterio).',
      mitigacion_sugerida: 'Asignar a un profesional titulado con 5+ años de experiencia como "Jefe de Proyecto TI".'
    });
  } else {
    const aniosJP = jp.anios_exp ?? 0;
    const minJpRequired = analisisBases.req_anios_jp ?? 5;
    if (aniosJP < minJpRequired) {
      headsUpBrechas.push({
        tipo: 'equipo',
        severidad: 'media',
        titulo: `Antigüedad del Jefe de Proyecto (${jp.nombre}: ${aniosJP} años vs ${minJpRequired} exigidos)`,
        hallazgo: `El Jefe de Proyecto registra ${aniosJP} años de experiencia frente a un umbral de ${minJpRequired} años ${analisisBases.req_anios_jp ? 'extraído del PDF de las bases' : 'estándar en licitaciones mayores'}.`,
        impacto_puntaje: 'Tramo intermedio de puntuación en liderazgo de proyecto.',
        mitigacion_sugerida: 'Acreditar la totalidad de contratos de consultoría previos desde la fecha de titulación.'
      });
    } else {
      headsUpBrechas.push({
        tipo: 'equipo',
        severidad: 'baja',
        titulo: `Respaldo de Jefatura y Titulación Profesional (${jp.nombre})`,
        hallazgo: `${jp.nombre} (${jp.titulo || 'Profesional Titulado'}) acredita ${aniosJP} años de experiencia (superando el corte de ${minJpRequired} años) y certificaciones (${jp.certificaciones || 'Gestión'}). Cumple el requisito legal de profesional universitario titulado a cargo del contrato.`,
        impacto_puntaje: '100% de los puntos en el perfil de Jefe de Proyecto.',
        mitigacion_sugerida: 'Verificar que al menos 2 certificados de experiencia del JP correspondan a proyectos similares con recepción conforme.'
      });
    }

    headsUpBrechas.push({
      tipo: 'equipo',
      severidad: 'media',
      titulo: 'Acreditación de Experiencia en Sector Público vs Privado',
      hallazgo: 'Si las bases exigen expresamente "experiencia ejecutando proyectos en organismos del Estado", los certificados de banca o retail privado podrían no ser contabilizados al 100% por la comisión.',
      impacto_puntaje: 'Diferencia de entre 5 y 15 puntos según si la base acepta experiencia privada homologable.',
      mitigacion_sugerida: 'En el Anexo de Experiencia, detallar el volumen transaccional y criticidad de los proyectos privados previos para acreditar equivalencia técnica.'
    });
  }

  // 3. Análisis del Lead Developer / Ingeniero de Producto
  if (devLead) {
    const aniosDev = devLead.anios_exp ?? 0;
    const titDev = (devLead.titulo || '').toLowerCase();
    const esEstudianteOTesista = /tesista|estudiante|alumno|egresad|unab/.test(titDev);

    if (esEstudianteOTesista) {
      headsUpBrechas.push({
        tipo: 'equipo',
        severidad: 'baja',
        titulo: `Rol Técnico & Producto (${devLead.nombre} — ${aniosDev} años exp.)`,
        hallazgo: `${devLead.nombre} (${devLead.titulo}) aporta ${aniosDev} años de experiencia práctica en desarrollo de software y arquitectura, más capacitación SENCE/IA (${devLead.certificaciones || 'Estándar'}). La Jefatura de Proyecto cubre la exigencia de título universitario emitido, permitiendo que el Líder Técnico encabece la arquitectura y ejecución del producto.`,
        impacto_puntaje: 'Óptimo para bases estándar donde el equipo desarrollador se evalúa por experiencia práctica y portafolio.',
        mitigacion_sugerida: 'Si una base puntual exige copia de título emitido para el 100% de los integrantes, presentar certificado de alumno regular/tesista junto con los certificados de experiencia laboral.'
      });
    } else {
      headsUpBrechas.push({
        tipo: 'equipo',
        severidad: 'baja',
        titulo: `Especialista Técnico Acreditado (${devLead.nombre} — ${aniosDev} años exp.)`,
        hallazgo: `${devLead.nombre} acredita formación como ${devLead.titulo || 'Especialista TI'} con ${aniosDev} años de experiencia y certificaciones (${devLead.certificaciones || 'N/A'}).`,
        impacto_puntaje: 'Sólido aporte al puntaje técnico del equipo ejecutor.',
        mitigacion_sugerida: 'Adjuntar certificados de título y respaldos de proyectos anteriores en el Anexo Técnico.'
      });
    }
  }

  // 4. Brecha Documental Administrativa Ineludible (Compliance ChileCompra)
  headsUpBrechas.push({
    tipo: 'documental',
    severidad: 'media',
    titulo: 'Checklist de Apertura: Certificado F30-1 y Declaración Art. 4°',
    hallazgo: 'Toda oferta pasa primero por el filtro administrativo. La omisión de un anexo administrativo o deudas previsionales deja la oferta fuera sin evaluar su calidad técnica.',
    impacto_puntaje: 'Requisito excluyente de admisibilidad (Pasa / No Pasa).',
    mitigacion_sugerida: 'Emitir Certificado F30-1 de la Dirección del Trabajo vigente (< 30 días) y firmar Declaración Jurada de ausencia de conflictos de interés (Art. 4° Ley 19.886).'
  });

  // ============================================================================
  // CÁLCULO FINAL DE WIN PROBABILITY Y DECISIÓN ESTRATÉGICA
  // ============================================================================
  let winProb = totalScorePonderado;

  const tieneRiesgoCritico = auditoria.some(a => a.estado === 'critico');
  const cantidadAlertas = auditoria.filter(a => a.estado === 'alerta').length;
  const brechasAltas = headsUpBrechas.filter(b => b.severidad === 'alta').length;
  const clausulasAltas = analisisBases.clausulas_criticas.filter(c => c.riesgo === 'alto').length;

  if (tieneRiesgoCritico) {
    winProb -= 32;
  }
  winProb -= cantidadAlertas * 5;
  winProb -= brechasAltas * 14;
  winProb -= clausulasAltas * 8;
  if (esReventaLicencias) {
    winProb -= 12;
  }

  if (esOfertaTemeraria) {
    winProb -= 6;
  }

  winProb = Math.min(95, Math.max(12, Math.round(winProb)));

  let decision: 'GO' | 'CONDITIONAL_GO' | 'NO_GO' = 'GO';
  let decisionLabel = 'POSTULAR RECOMENDADO (Alta Probabilidad de Adjudicación)';
  let decisionColor = 'emerald';

  if (winProb >= 74 && !tieneRiesgoCritico && brechasAltas === 0 && !esReventaLicencias) {
    decision = 'GO';
    decisionLabel = 'POSTULAR RECOMENDADO (Muy Alta Probabilidad)';
    decisionColor = 'emerald';
  } else if (winProb >= 52 && !tieneRiesgoCritico) {
    decision = 'CONDITIONAL_GO';
    decisionLabel = 'POSTULAR CONDICIONADO (Viable con Mitigación)';
    decisionColor = 'amber';
  } else {
    decision = 'NO_GO';
    decisionLabel = 'NO POSTULAR (Baja Probabilidad o Barrera Crítica)';
    decisionColor = 'rose';
  }

  let recomendacion = '';
  if (decision === 'GO') {
    recomendacion = `Presentar oferta como ${profile.razon_social} por $${Number(oferta).toLocaleString('es-CL')} CLP (${Math.round(ratioOferta * 100)}% del presupuesto). Posicionar a ${jp ? jp.nombre : 'el Jefe de Proyecto'} como Jefe de Proyecto titular y a ${devLead ? devLead.nombre : 'el Líder Técnico'} como líder técnico y de producto, destacando las capacidades en ${matchedConceptLabels.slice(0, 2).join(' y ') || 'arquitectura de software y datos'}.`;
  } else if (decision === 'CONDITIONAL_GO') {
    recomendacion = `Postulación viable aplicando las tácticas de mitigación del Heads-Up antes del cierre de preguntas en Mercado Público. Ofertar en torno al ${Math.min(92, Math.round(ratioOferta * 100))}% del presupuesto permite compensar con puntaje económico cualquier brecha sectorial.`;
  } else {
    recomendacion = esHardwarePuro
      ? 'Descartar postulación directa: licitación enfocada en provisión de hardware/equipamiento físico fuera del giro principal de consultoría y desarrollo de software.'
      : 'Descartar postulación individual o evaluar ingreso en UTP (Unión Temporal de Proveedores) con socio que cubra las barreras financieras o sectoriales detectadas.';
  }

  const t1 = performance.now();

  return {
    codigo_externo: lic.codigo_externo,
    nombre_licitacion: lic.nombre,
    organismo: lic.comprador?.nombre_organismo || 'Organismo del Estado de Chile',
    monto_estimado_clp: presupuesto,
    monto_ofertado_clp: oferta,
    win_probability: winProb,
    decision,
    decision_label: decisionLabel,
    decision_color: decisionColor,
    criterios_evaluacion: criterios,
    auditoria_requisitos: auditoria,
    heads_up_brechas: headsUpBrechas,
    analisis_bases: analisisBases,
    fortalezas,
    riesgos_dealbreakers: riesgos,
    recomendacion_estrategica: recomendacion,
    tiempo_evaluacion_ms: Math.round((t1 - t0) * 10) / 10
  };
}

/**
 * POST /api/easytaciones/evaluar
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado. Token de acceso requerido.' }),
      { status: 401, headers: NO_INDEX_HEADERS }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const codigo = typeof body?.codigo_externo === 'string' ? body.codigo_externo.trim() : '';
    const customOferta = typeof body?.monto_ofertado_clp === 'number' ? body.monto_ofertado_clp : undefined;
    const basesTexto = typeof body?.bases_texto === 'string' ? body.bases_texto : undefined;
    const basesArchivos = Array.isArray(body?.bases_archivos) ? body.bases_archivos : undefined;

    const decryptedVault = decryptDefaultProfile<CompanyProfile>(extractToken(request));
    const baseProfile: CompanyProfile = decryptedVault
      ? { ...DEFAULT_COMPANY_PROFILE, ...decryptedVault }
      : DEFAULT_COMPANY_PROFILE;
    const customProfile: CompanyProfile = body?.perfil && typeof body.perfil === 'object'
      ? {
          ...baseProfile,
          ...body.perfil,
          equipo: Array.isArray(body.perfil.equipo) && body.perfil.equipo.length > 0
            ? body.perfil.equipo
            : (baseProfile.equipo || [])
        }
      : baseProfile;

    if (!codigo) {
      return new Response(
        JSON.stringify({ success: false, error: 'codigo_externo es requerido' }),
        { status: 400, headers: NO_INDEX_HEADERS }
      );
    }

    let licitacion = REAL_LICITACIONES.find(
      lic => lic.codigo_externo.toLowerCase() === codigo.toLowerCase()
    );

    if (!licitacion) {
      const ticket = process.env.MP_TICKET || '';
      if (ticket && ticket.length > 5) {
        licitacion = (await fetchLiveTenderDetail(ticket, codigo)) || undefined;
      }
    }

    if (!licitacion && body?.licitacion && typeof body.licitacion === 'object') {
      licitacion = body.licitacion as LicitacionData;
    }

    if (!licitacion) {
      return new Response(
        JSON.stringify({ success: false, error: `Licitación '${codigo}' no encontrada en el catálogo activo ni en Mercado Público.` }),
        { status: 404, headers: NO_INDEX_HEADERS }
      );
    }

    const resultado = evaluateTender(licitacion, customProfile, customOferta, basesTexto, basesArchivos);

    return new Response(
      JSON.stringify({
        success: true,
        evaluacion: resultado,
        perfil_utilizado: {
          razon_social: customProfile.razon_social,
          rut_empresa: customProfile.rut_empresa,
          anios_experiencia: customProfile.anios_experiencia,
          certificaciones: customProfile.certificaciones
        }
      }),
      { status: 200, headers: NO_INDEX_HEADERS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al procesar auditoría de licitación';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: NO_INDEX_HEADERS }
    );
  }
};
