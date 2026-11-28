interface Ministerio {
  nombre: string;
  titular: string | null;
  vocero: boolean;
}

type EstadoIniciativa =
  | 'recogiendo'
  | 'en_revision'
  | 'aceptada'
  | 'rechazada'
  | 'retirada'
  | 'vencida';

interface Iniciativa {
  id: number;
  alias: string;
  partido?: string;
  mia: boolean;
  estado: EstadoIniciativa;
  dias: number;
  apoyos: number;
  meta: number;
  apoyada: boolean;
  titulo: string;
  texto: string;
  nota?: string;
}

interface Candidato {
  id: number;
  alias: string;
  lema: string;
  partido: string | null;
  apoyos: number;
}

interface Partido {
  id: number;
  sigla: string;
  nombre: string;
  emoji: string;
  color: string;
  miembros: number;
  mio: boolean;
  lema: string;
  programa: string[];
  presidente: string;
  militantesMuestra: string[];
}

interface OpcionVoto {
  id: string;
  titulo: string;
  resumen: string;
  votosPct: number;
  efectos: Array<{ calidad: 'A' | 'B' | 'C'; detalle: string }>;
}

interface MensajeForo {
  id: number;
  canal: string;
  alias: string;
  partido?: string;
  cargo?: string;
  hace: string;
  texto: string;
  likes: number;
  liked?: boolean;
}

interface Notificacion {
  id: number;
  icono: string;
  titulo: string;
  detalle: string;
  hace: string;
  leida: boolean;
  link: string;
}

interface ChatMsg {
  mio: boolean;
  texto: string;
  hace: string;
}

interface ChatMD {
  id: number;
  alias: string;
  partido?: string;
  noLeidos: number;
  mensajes: ChatMsg[];
}

interface MensajePartido {
  id: number;
  alias: string;
  rol?: string;
  hace: string;
  texto: string;
}

type MainSection =
  | 'inicio'
  | 'votar'
  | 'pais'
  | 'politica'
  | 'foro'
  | 'mas'
  | 'notificaciones'
  | 'mensajes'
  | 'partido-chat';
type PoliticaSubtab = 'iniciativas' | 'gobierno' | 'elecciones' | 'partidos';
type FilterKey = 'apoyo' | 'nuevas' | 'hab' | 'cer' | 'mias';

const MINISTERIOS: Ministerio[] = [
  { nombre: 'Interior', titular: null, vocero: false },
  { nombre: 'Seguridad Pública', titular: null, vocero: false },
  { nombre: 'Relaciones Exteriores', titular: null, vocero: false },
  { nombre: 'Defensa Nacional', titular: null, vocero: false },
  { nombre: 'Hacienda', titular: null, vocero: false },
  { nombre: 'Secretaría General de la Presidencia', titular: null, vocero: false },
  { nombre: 'Secretaría General de Gobierno', titular: null, vocero: true },
  { nombre: 'Economía, Fomento y Turismo', titular: null, vocero: false },
  { nombre: 'Desarrollo Social y Familia', titular: null, vocero: false },
  { nombre: 'Educación', titular: null, vocero: false },
  { nombre: 'Justicia y Derechos Humanos', titular: null, vocero: false },
  { nombre: 'Trabajo y Previsión Social', titular: null, vocero: false },
  { nombre: 'Obras Públicas', titular: null, vocero: false },
  { nombre: 'Salud', titular: null, vocero: false },
  { nombre: 'Vivienda y Urbanismo', titular: null, vocero: false },
  { nombre: 'Agricultura', titular: null, vocero: false },
  { nombre: 'Minería', titular: null, vocero: false },
  { nombre: 'Transportes y Telecomunicaciones', titular: null, vocero: false },
  { nombre: 'Bienes Nacionales', titular: null, vocero: false },
  { nombre: 'Energía', titular: null, vocero: false },
  { nombre: 'Medio Ambiente', titular: null, vocero: false },
  { nombre: 'Deporte', titular: null, vocero: false },
  { nombre: 'Mujer y la Equidad de Género', titular: null, vocero: false },
  { nombre: 'Culturas, las Artes y el Patrimonio', titular: null, vocero: false },
  { nombre: 'Ciencia, Tecnología, Conocimiento e Innovación', titular: null, vocero: false }
];

const PARTIDOS: Partido[] = [
  {
    id: 1,
    sigla: 'PEN',
    nombre: 'Partido Estudiantil Nacional',
    emoji: '🗂️',
    color: '#1D7A3A',
    miembros: 34,
    mio: true,
    lema: 'Educación pública, transporte justo y ciencia abierta',
    programa: [
      'Impulsamos un sistema de educación pública fortalecido desde las regiones, transporte integrado accesible con pases estudiantiles universales y financiamiento estable para investigación científica nacional.',
      'Creemos en la participación ciudadana activa, la transparencia fiscal y políticas basadas en evidencia verificable para mejorar la calidad de vida cotidiana.'
    ],
    presidente: 'ValentinaP',
    militantesMuestra: ['ValentinaP', 'Mike', 'Ignacia_C', 'ProfeNorte', 'Matias_RM']
  },
  {
    id: 2,
    sigla: 'PSD',
    nombre: 'Partido Social Demócrata',
    emoji: '🌹',
    color: '#C62828',
    miembros: 127,
    mio: false,
    lema: 'Socialesdemócratas Unidos Por el Pueblo de Chile',
    programa: [
      'Nuestra visión como partido es defender los derechos de todas las personas y construir una sociedad más justa, inclusiva, igualitaria y democrática. Creemos en una política que ponga a las personas en el centro, que ofrezca oportunidades a todos sin importar su origen, su situación económica o sus diferencias sociales.',
      'Como partido de orientación socialdemócrata y de izquierda, defendemos una educación pública de calidad, una salud digna y accesible, un trabajo decente, una protección social sólida y la igualdad de oportunidades. Queremos fortalecer el papel del Estado como garante de los derechos, promoviendo el bienestar colectivo, la solidaridad y la justicia social.'
    ],
    presidente: 'Agus',
    militantesMuestra: ['Agus', 'draxita', 'Ciudadana Mirlo', 'Joshimin', 'Lexx', 'CamilaR_Bio', 'GonzalezN50']
  },
  {
    id: 3,
    sigla: 'PSCHL',
    nombre: 'Partido Socialista',
    emoji: '🏛️',
    color: '#AD1457',
    miembros: 91,
    mio: false,
    lema: 'Igualdad sustantiva y Estado garante de derechos',
    programa: [
      'Trabajamos por un sistema único solidario de salud y seguridad social sin fines de lucro, fortaleciendo la red pública hospitalaria y el acceso oportuno en todo el territorio.',
      'Promovemos una reforma tributaria progresiva que sustente derechos sociales permanentes con responsabilidad fiscal y descentralización efectiva.'
    ],
    presidente: 'Mateo_Sur',
    militantesMuestra: ['Mateo_Sur', 'Alejo_Hinojo', 'Paula_L', 'ValpoSur']
  },
  {
    id: 4,
    sigla: 'PDT',
    nombre: 'Partido del Trabajo',
    emoji: '⚙️',
    color: '#B3241A',
    miembros: 60,
    mio: false,
    lema: 'Trabajo decente, sindicatos fuertes e industria nacional',
    programa: [
      'Defendemos la negociación colectiva ramal, el salario mínimo vital y la reducción gradual de la jornada laboral sin pérdida de ingresos para las familias trabajadoras.',
      'Apostamos por la industrialización del litio y el cobre con valor agregado local, cooperativas productivas y empresas estratégicas públicas eficientes.'
    ],
    presidente: 'Lucas_Norte',
    militantesMuestra: ['Lucas_Norte', 'Elena_Arauco', 'Tito_Cobre', 'Cóndor Sureño 75']
  },
  {
    id: 5,
    sigla: 'SPC',
    nombre: 'Partido Soberanía por la Patria Chilena',
    emoji: '🏔️',
    color: '#1565C0',
    miembros: 48,
    mio: false,
    lema: 'Recursos estratégicos para el desarrollo nacional',
    programa: [
      'Priorizamos el control soberano de recursos naturales estratégicos, energía limpia y seguridad barrial con prevención e inteligencia financiera contra el crimen organizado.',
      'Buscamos equilibrar protección social, infraestructura pública regional y reglas claras para la inversión productiva.'
    ],
    presidente: 'Diego_M',
    militantesMuestra: ['Diego_M', 'Addax alegre', 'Seba_Maipu']
  },
  {
    id: 6,
    sigla: 'DEMO',
    nombre: 'Partido Demócrata',
    emoji: '🤝',
    color: '#283593',
    miembros: 39,
    mio: false,
    lema: 'Diálogo social y reformas sostenibles',
    programa: [
      'Creemos en grandes acuerdos institucionales para vivienda digna, ciudades integradas y modernización del Estado con evaluación permanente de políticas públicas.',
      'Defendemos presupuestos participativos regionales y un sistema político estable enfocado en resultados medibles.'
    ],
    presidente: 'Sofía_V',
    militantesMuestra: ['Sofía_V', 'Andrés_RM', 'Dra_Valdivia']
  }
];

const INICIATIVAS: Iniciativa[] = [
  {
    id: 616,
    alias: 'Mike',
    partido: 'PEN',
    mia: true,
    estado: 'recogiendo',
    dias: 14,
    apoyos: 1,
    meta: 150,
    apoyada: false,
    titulo: 'Tarifa plana, pases periódicos y tope mensual universal en transporte público',
    texto: 'Se baja la tarifa integrada (~$600) y se frena la evasión y el gasto familiar en traslados. Propongo crear pases semanales, mensuales y anuales, y extender el tope mensual de gasto (hoy limitado al QR) a tarjetas físicas, TNE y TAM mediante validación por cuenta. Se financiará con ingresos anticipados de abonos, remanentes de peajes viales públicos e impuestos verdes, midiéndose por caída en la evasión y aumento de validaciones.'
  },
  {
    id: 612,
    alias: 'Mike',
    partido: 'PEN',
    mia: true,
    estado: 'recogiendo',
    dias: 14,
    apoyos: 1,
    meta: 148,
    apoyada: false,
    titulo: 'Fin a monopolios extranjeros de agua y luz: gestión pública y cooperativa',
    texto: 'Se corta el abuso de concesiones extranjeras en luz y agua que cobran tarifas altas pero fallan en prevención y cortes tras temporales. Propongo recuperar la gestión mediante empresas municipales autónomas (modelo SMAPA) y cooperativas regionales sin fines de lucro. Se financiará no renovando concesiones vencidas y recomprando redes estratégicas con un Fondo Nacional respaldado por Royalty y bonos soberanos, midiéndose por caída tarifaria y continuidad de suministro.'
  },
  {
    id: 606,
    alias: 'GonzalezN50',
    partido: 'PSD',
    mia: false,
    estado: 'recogiendo',
    dias: 14,
    apoyos: 25,
    meta: 146,
    apoyada: false,
    titulo: 'Modificación a la Ley N°21.420 (Impuestos al Lujo)',
    texto: 'Extender el hecho gravado a bienes de alto valor situados fuera de Chile cuyo beneficiario final sea contribuyente domiciliado en el país, estableciendo presunción legal de uso personal cuando la sociedad propietaria no acredite ingresos operativos reales y cálculo progresivo sobre el valor acumulado.'
  },
  {
    id: 589,
    alias: 'ValpoSur',
    partido: 'PSCHL',
    mia: false,
    estado: 'recogiendo',
    dias: 13,
    apoyos: 14,
    meta: 146,
    apoyada: false,
    titulo: 'Red de trenes suburbanos regionales con tarifa integrada',
    texto: 'Priorizar inversión pública en servicios ferroviarios suburbanos para Valparaíso, Biobío y La Araucanía con integración tarifaria hacia buses locales, financiada mediante reasignación de concesiones viales de baja rentabilidad social y bono verde.'
  },
  {
    id: 571,
    alias: 'CamilaR_Bio',
    partido: 'PSD',
    mia: false,
    estado: 'recogiendo',
    dias: 12,
    apoyos: 41,
    meta: 142,
    apoyada: false,
    titulo: 'Banca pública de desarrollo para pymes industriales y cooperativas',
    texto: 'Crear una línea de crédito de largo plazo a tasa real baja desde BancoEstado orientada a manufactura local, energías limpias y cooperativas agrícolas, sujeta a metas medibles de formalización y empleo.'
  },
  {
    id: 544,
    alias: 'ProfeNorte',
    partido: 'PEN',
    mia: false,
    estado: 'recogiendo',
    dias: 11,
    apoyos: 64,
    meta: 140,
    apoyada: true,
    titulo: 'Titularidad docente automática tras 3 años y reducción de horas no lectivas',
    texto: 'Establecer un calendario gradual de 4 años para llevar la proporción lectiva/no lectiva a 55/45 en educación pública y subvencionada, financiando reemplazos con el Fondo de Educación Pública y evaluando impacto en retención docente.'
  },
  {
    id: 512,
    alias: 'Addax alegre',
    partido: 'SPC',
    mia: false,
    estado: 'recogiendo',
    dias: 13,
    apoyos: 92,
    meta: 133,
    apoyada: false,
    titulo: 'Nueva constitución participativa con asambleas territoriales',
    texto: 'Impulsar un nuevo proceso constitucional con cabildos vinculantes regionales y enfoque en derechos sociales garantizados, financiamiento público transparente y control ciudadano de metas.'
  },
  {
    id: 488,
    alias: 'Alejo_Hinojo',
    partido: 'PSCHL',
    mia: false,
    estado: 'recogiendo',
    dias: 12,
    apoyos: 88,
    meta: 130,
    apoyada: true,
    titulo: 'Auditoría pública externa obligatoria cada 4 años para hospitales',
    texto: 'Exigir auditorías financieras y operacionales independientes cada cuatro años en todos los hospitales públicos y concesionados, publicando sueldos, compras y contratos con empresas externas en formato abierto.'
  },
  {
    id: 425,
    alias: 'Cóndor Sureño 75',
    partido: 'PDT',
    mia: false,
    estado: 'recogiendo',
    dias: 13,
    apoyos: 53,
    meta: 114,
    apoyada: false,
    titulo: 'Que tu sueldo alcance: estabilización de precios en bienes esenciales',
    texto: 'Implementar un mecanismo transparente de bandas de estabilización para alimentos básicos, medicamentos y energía mediante compras públicas estratégicas y control de márgenes en mercados concentrados.'
  },
  {
    id: 390,
    alias: 'Elena_Arauco',
    partido: 'PDT',
    mia: false,
    estado: 'recogiendo',
    dias: 10,
    apoyos: 19,
    meta: 120,
    apoyada: false,
    titulo: 'Fondo de arriendo justo y banco de suelos fiscales urbanos',
    texto: 'Destinar terrenos fiscales bien ubicados a cooperativas de vivienda en arriendo protegido sin fines de lucro, fijando un tope máximo equivalente al 25% del ingreso del hogar.'
  },
  {
    id: 342,
    alias: 'Matias_RM',
    partido: 'PEN',
    mia: false,
    estado: 'recogiendo',
    dias: 9,
    apoyos: 7,
    meta: 118,
    apoyada: false,
    titulo: 'Jornada laboral de 38 horas con piloto en servicios y comercio',
    texto: 'Adelantar metas de productividad y flexibilidad pactada para alcanzar 38 horas semanales sin rebaja salarial, con apoyo técnico estatal para pymes durante la transición.'
  },
  {
    id: 154,
    alias: 'Mike',
    partido: 'PEN',
    mia: true,
    estado: 'en_revision',
    dias: 0,
    apoyos: 66,
    meta: 66,
    apoyada: false,
    titulo: 'Prohibición del lucro en salud y reconversión a sistema sin fines de lucro',
    texto: 'Exigir que clínicas, hospitales y aseguradoras operen exclusivamente bajo administración estatal o corporaciones sin fines de lucro con reinversión obligatoria de excedentes. Financiado unificando el 7% en un Fondo Único de Salud y fondo de transición a 5 años; medible por gasto de bolsillo OCDE y tiempos DEIS.'
  },
  {
    id: 146,
    alias: 'Mike',
    partido: 'PEN',
    mia: true,
    estado: 'en_revision',
    dias: 0,
    apoyos: 65,
    meta: 65,
    apoyada: false,
    titulo: 'Exención de IVA (0%) para canasta básica, medicamentos e higiene',
    texto: 'Rebajar el IVA del 19% al 0% en alimentos básicos, medicamentos esenciales e higiene personal, compensando con impuesto suntuario, correctivos y fin de exenciones, medible por IPC y Encuesta de Presupuestos Familiares.'
  },
  {
    id: 118,
    alias: 'Dra_Valdivia',
    partido: 'DEMO',
    mia: false,
    estado: 'aceptada',
    dias: 0,
    apoyos: 84,
    meta: 64,
    apoyada: false,
    titulo: 'Sistema Nacional de Cuidados con remuneración a cuidadoras principales',
    texto: 'Establecer un estipendio mensual y cotizaciones previsionales para personas dedicadas al cuidado de dependientes severos, financiado con reasignación de gasto tributario y medido por inserción laboral femenina.'
  },
  {
    id: 97,
    alias: 'Tito_Cobre',
    partido: 'PDT',
    mia: false,
    estado: 'aceptada',
    dias: 0,
    apoyos: 78,
    meta: 60,
    apoyada: false,
    titulo: 'Empresa Nacional del Litio con refinación y valor agregado local',
    texto: 'Crear consorcios con mayoría estatal para extracción directa y refinación de litio en el país, destinando el 30% de excedentes a I+D universitario y transición energética regional.'
  },
  {
    id: 62,
    alias: 'Seba_Maipu',
    partido: 'SPC',
    mia: false,
    estado: 'rechazada',
    dias: 0,
    apoyos: 41,
    meta: 40,
    apoyada: false,
    nota: 'Árbitro: faltó precisar fuente de financiamiento verificable y línea base oficial para medir impacto.',
    titulo: 'Condonación universal inmediata sin gradualidad fiscal',
    texto: 'Condonación total e inmediata de deudas educativas y de servicios básicos sin establecer tramos ni financiamiento detallado.'
  }
];

const CANDIDATOS: Candidato[] = [
  { id: 1, alias: 'CamilaR_Bio', lema: 'Estado eficiente, salario digno y transición verde real', partido: 'PSD', apoyos: 142 },
  { id: 2, alias: 'Mateo_Sur', lema: 'Salud universal sin listas de espera eternas', partido: 'PSCHL', apoyos: 118 },
  { id: 3, alias: 'ValentinaP', lema: 'Educación pública fuerte desde las regiones', partido: 'PEN', apoyos: 96 },
  { id: 4, alias: 'Lucas_Norte', lema: 'Litio e industria nacional con valor agregado', partido: 'PDT', apoyos: 81 },
  { id: 5, alias: 'Sofía_V', lema: 'Vivienda digna y ciudades pensadas para caminar', partido: 'DEMO', apoyos: 64 },
  { id: 6, alias: 'Diego_M', lema: 'Seguridad barrial con prevención e inteligencia', partido: 'SPC', apoyos: 49 },
  { id: 7, alias: 'Ignacia_C', lema: 'Ciencia, tecnología y pymes cooperativas', partido: 'PEN', apoyos: 38 },
  { id: 8, alias: 'Tomás_A', lema: 'Reforma tributaria progresiva sin asfixiar al empleo', partido: 'PSD', apoyos: 27 },
  { id: 9, alias: 'Paula_L', lema: 'Sistema nacional de cuidados y pensiones justas', partido: 'PSCHL', apoyos: 19 },
  { id: 10, alias: 'Fcotr', lema: 'Una izquierda pragmática, con los pies en la tierra', partido: null, apoyos: 8 },
  { id: 11, alias: 'Santiago F.', lema: 'Baja el estrés, acompáñanos en terreno', partido: null, apoyos: 5 },
  { id: 12, alias: 'Andrés_RM', lema: 'Descentralización real y presupuestos participativos', partido: 'DEMO', apoyos: 3 }
];

const OPCIONES_VOTO: OpcionVoto[] = [
  {
    id: 'a',
    titulo: 'Pensión estatal universal financiada con impuestos generales',
    resumen: 'Reemplaza gradualmente la capitalización individual por un pilar público universal.',
    votosPct: 28,
    efectos: [
      { calidad: 'A', detalle: 'Seguro: +12 cohesión social; +1,1 % PIB en gasto fiscal anual.' },
      { calidad: 'B', detalle: 'Riesgo (35 %): caída en ahorro nacional y menor confianza inversionista (-6).' }
    ]
  },
  {
    id: 'b',
    titulo: 'Sistema mixto con mayor aporte del empleador a fondo solidario',
    resumen: 'Mantiene cuentas individuales y destina 4 % adicional a solidaridad intergeneracional.',
    votosPct: 46,
    efectos: [
      { calidad: 'A', detalle: 'Seguro: mejora inmediata de pensiones actuales (+18 %) y -5 malestar social.' },
      { calidad: 'B', detalle: 'Riesgo (20 %): leve alza en informalidad laboral (+0,4 % desempleo).' }
    ]
  },
  {
    id: 'c',
    titulo: 'Ajustes paramétricos graduales y PGU focalizada',
    resumen: 'Sube edad de jubilación en 2 años con incentivos al ahorro voluntario.',
    votosPct: 18,
    efectos: [
      { calidad: 'A', detalle: 'Seguro: ahorro fiscal de 0,4 % PIB y +4 estabilidad política.' },
      { calidad: 'C', detalle: 'Riesgo (40 %): aumento de malestar social (+8) en el corto plazo.' }
    ]
  },
  {
    id: 'd',
    titulo: 'Cuentas individuales con libre elección de administrador y retiro acotado',
    resumen: 'Amplía competencia privada y permite uso parcial para primera vivienda.',
    votosPct: 8,
    efectos: [
      { calidad: 'B', detalle: 'Seguro: +5 confianza de inversionistas; menor liquidez previsional futura.' },
      { calidad: 'B', detalle: 'Riesgo (30 %): presión inflacionaria transitoria (+0,5 %).' }
    ]
  }
];

const KPIS_PAIS = [
  { nombre: 'Crecimiento del PIB', val: '-1,1 %', fuente: 'Banco Central · jul–sep 2026 vs 2025' },
  { nombre: 'Desempleo', val: '9,8 %', fuente: 'INE · trimestre jul–sep 2026' },
  { nombre: 'Inflación (12m)', val: '4,5 %', fuente: 'INE · octubre 2026' },
  { nombre: 'Déficit fiscal', val: '1,8 % PIB', fuente: 'DIPRES · septiembre 2026' },
  { nombre: 'Deuda pública', val: '44,7 % PIB', fuente: 'DIPRES · septiembre 2026' },
  { nombre: 'Pobreza por ingresos', val: '17,3 %', fuente: 'Casen 2024 · pub. 2026' },
  { nombre: 'Desigualdad (Gini)', val: '0,464', fuente: 'Casen 2024 · pub. 2026' }
];

const TERMOMETRO = [
  { nombre: 'Malestar social', val: 50 },
  { nombre: 'Seguridad', val: 50 },
  { nombre: 'Cohesión social', val: 50 },
  { nombre: 'Confianza de inversionistas', val: 50 },
  { nombre: 'Estabilidad política', val: 50 }
];

const CANALES_FORO = [
  { id: 'general', icono: '💬', nombre: 'General' },
  { id: 'economia', icono: '💰', nombre: 'Economía e impuestos' },
  { id: 'seguridad', icono: '🚓', nombre: 'Seguridad' },
  { id: 'inmigracion', icono: '🧳', nombre: 'Inmigración' },
  { id: 'salud-educacion', icono: '🏥', nombre: 'Salud y educación' },
  { id: 'vivienda', icono: '🏠', nombre: 'Vivienda' }
];

const MENSAJES_FORO: MensajeForo[] = [
  {
    id: 1,
    canal: 'general',
    alias: 'Mike',
    partido: 'PEN',
    hace: 'hace 12 min',
    texto: 'Dejé dos propuestas nuevas para transporte y servicios básicos (#ini616 y #ini612). Toca cualquier código para probar el salto directo en la pestaña Iniciativas.',
    likes: 9
  },
  {
    id: 2,
    canal: 'general',
    alias: 'ValentinaP',
    partido: 'PEN',
    hace: 'hace 28 min',
    texto: 'Qué buena mejora poder abrir #ini616 directo desde el foro sin perderse en el scroll.',
    likes: 14
  },
  {
    id: 3,
    canal: 'economia',
    alias: 'GonzalezN50',
    partido: 'PSD',
    hace: 'hace 1 h',
    texto: 'Si miran #ini146 (IVA 0%) y #ini606 (Impuesto al lujo), conviene revisar cómo compensar el déficit fiscal en el motor antes del próximo Loto.',
    likes: 11
  },
  {
    id: 4,
    canal: 'salud-educacion',
    alias: 'Alejo_Hinojo',
    partido: 'PSCHL',
    hace: 'hace 2 h',
    texto: 'Ya están en revisión #ini154 sobre sistema de salud sin fines de lucro y #ini488 de auditoría hospitalaria.',
    likes: 16
  },
  {
    id: 5,
    canal: 'seguridad',
    alias: 'Diego_M',
    partido: 'SPC',
    hace: 'hace 3 h',
    texto: 'En la primera semana del plan de choque el foco debiera combinar control fronterizo y seguimiento financiero al crimen organizado.',
    likes: 7
  },
  {
    id: 6,
    canal: 'inmigracion',
    alias: 'Elena_Arauco',
    partido: 'PDT',
    hace: 'hace 4 h',
    texto: 'Regularización con trazabilidad laboral ayuda a bajar informalidad sin saturar servicios locales.',
    likes: 5
  },
  {
    id: 7,
    canal: 'vivienda',
    alias: 'Sofía_V',
    partido: 'DEMO',
    hace: 'hace 5 h',
    texto: 'Revisen #ini390 sobre banco de suelos urbanos fiscales y cooperativas de arriendo protegido.',
    likes: 12
  }
];

const NOTIFICACIONES: Notificacion[] = [
  {
    id: 1,
    icono: '🎉',
    titulo: 'Tu iniciativa #ini154 llegó a la meta',
    detalle: '66 de 66 apoyos · pasó a revisión del Árbitro.',
    hace: 'hace 25 min',
    leida: false,
    link: 'ini:154'
  },
  {
    id: 2,
    icono: '💬',
    titulo: 'ValentinaP te mencionó en General',
    detalle: '«Qué buena mejora poder abrir #ini616 directo desde el foro sin perderse en el scroll.»',
    hace: 'hace 28 min',
    leida: false,
    link: 'foro:general'
  },
  {
    id: 3,
    icono: '🐞',
    titulo: 'Nueva insignia desbloqueada: Cazador de bugs',
    detalle: 'Tu perfil ya muestra la insignia exclusiva de la temporada.',
    hace: 'hace 2 h',
    leida: false,
    link: 'perfil'
  },
  {
    id: 4,
    icono: '🎉',
    titulo: 'Tu iniciativa #ini146 llegó a la meta',
    detalle: '65 de 65 apoyos · Exención de IVA (0%) en revisión.',
    hace: 'ayer',
    leida: true,
    link: 'ini:146'
  },
  {
    id: 5,
    icono: '🌹',
    titulo: 'Agus publicó el programa de PSD',
    detalle: 'Revisa las propuestas de Partido Social Demócrata.',
    hace: 'ayer',
    leida: true,
    link: 'party:PSD'
  }
];

const CHATS_MD: ChatMD[] = [
  {
    id: 1,
    alias: 'ValentinaP',
    partido: 'PEN',
    noLeidos: 1,
    mensajes: [
      { mio: false, texto: 'Hola Mike! Vi que subiste #ini616 del transporte, está buenísima para moverla desde el PEN.', hace: '14:15' },
      { mio: true, texto: 'Buena! Sí, recién arreglaron lo de las iniciativas nuevas así que ahora sí se ve.', hace: '14:18' },
      { mio: false, texto: 'Genial, la voy a compartir en el chat interno del partido para juntar apoyos hoy.', hace: '14:22' }
    ]
  },
  {
    id: 2,
    alias: 'CamilaR_Bio',
    partido: 'PSD',
    noLeidos: 1,
    mensajes: [
      { mio: false, texto: 'Buenas! Estuvimos revisando #ini146 y nos interesa coordinar cómo compensar el déficit en Economía.', hace: '12:40' }
    ]
  },
  {
    id: 3,
    alias: 'Alejo_Hinojo',
    partido: 'PSCHL',
    noLeidos: 0,
    mensajes: [
      { mio: true, texto: 'Apoyada tu iniciativa #ini488 de auditoría hospitalaria 👍', hace: 'ayer' },
      { mio: false, texto: 'Muchas gracias! Yo también apoyé la de salud sin fines de lucro.', hace: 'ayer' }
    ]
  }
];

const CHATS_PARTIDO: Record<string, MensajePartido[]> = {
  PEN: [
    { id: 1, alias: 'ValentinaP', rol: 'Presidente del partido', hace: 'hace 18 min', texto: 'Equipo, revisemos #ini616 y #ini612 de Mike para apoyarlas antes del cierre de semana.' },
    { id: 2, alias: 'Ignacia_C', hace: 'hace 42 min', texto: 'Ya sumé mi apoyo a #ini616. También estoy armando borrador para I+D en universidades estatales.' },
    { id: 3, alias: 'ProfeNorte', hace: 'hace 2 h', texto: 'Gracias a quienes apoyaron #ini544 de titularidad docente! Vamos a mitad de camino.' }
  ],
  PSD: [
    { id: 1, alias: 'Agus', rol: 'Presidente del partido', hace: 'hace 15 min', texto: 'Bienvenidos a quienes se sumaron hoy! Coordinemos apoyos para la candidatura de CamilaR_Bio.' },
    { id: 2, alias: 'draxita', hace: 'hace 1 h', texto: 'Revisen #ini606 sobre Ley N°21.420 que propuso GonzalezN50.' }
  ],
  PSCHL: [
    { id: 1, alias: 'Mateo_Sur', rol: 'Presidente del partido', hace: 'hace 35 min', texto: 'Prioridad esta semana: listas de espera hospitalarias y #ini488.' }
  ],
  PDT: [
    { id: 1, alias: 'Lucas_Norte', rol: 'Presidente del partido', hace: 'hace 50 min', texto: 'Empujemos #ini97 sobre valor agregado al litio en la bandeja de habilitadas.' }
  ],
  SPC: [
    { id: 1, alias: 'Diego_M', rol: 'Presidente del partido', hace: 'hace 1 h', texto: 'Coordinemos propuestas de seguridad barrial y control fronterizo para la votación del domingo.' }
  ],
  DEMO: [
    { id: 1, alias: 'Sofía_V', rol: 'Presidente del partido', hace: 'hace 45 min', texto: 'Busquemos acuerdos amplios para aprobar #ini118 del Sistema Nacional de Cuidados.' }
  ]
};

const state: {
  mode: 'propuesta' | 'legacy';
  section: MainSection;
  subtab: PoliticaSubtab;
  filter: FilterKey;
  query: string;
  iniLimit: number;
  candLimit: number;
  iniLoadingMore: boolean;
  highlightIniId: number | null;
  supportedCandId: number | null;
  nextId: number;
  minOpen: boolean;
  selectedBallot: string;
  votedBallot: boolean;
  activeChannel: string;
  nextMsgId: number;
  activePartySigla: string | null;
  activeChatId: number;
  nextPartyMsgId: number;
} = {
  mode: 'propuesta',
  section: 'politica',
  subtab: 'iniciativas',
  filter: 'apoyo',
  query: '',
  iniLimit: 6,
  candLimit: 6,
  iniLoadingMore: false,
  highlightIniId: null,
  supportedCandId: 3,
  nextId: 617,
  minOpen: false,
  selectedBallot: 'b',
  votedBallot: false,
  activeChannel: 'general',
  nextMsgId: 8,
  activePartySigla: null,
  activeChatId: 1,
  nextPartyMsgId: 20
};

const $root = document.getElementById('appRoot') as HTMLElement;
const $modeBadge = document.getElementById('modeBadge') as HTMLElement;
const $btnModeProp = document.getElementById('btnModeProp') as HTMLButtonElement;
const $btnModeLegacy = document.getElementById('btnModeLegacy') as HTMLButtonElement;
const $toast = document.getElementById('toast') as HTMLElement;
const $modal = document.getElementById('profileModal') as HTMLElement;
const $partyModal = document.getElementById('partyModal') as HTMLElement;
const $partyModalBox = document.getElementById('partyModalBox') as HTMLElement;

let toastTimer: number | undefined;
let searchTimer: number | undefined;
let lastFocusedBeforeModal: HTMLElement | null = null;
let lastFocusedBeforePartyModal: HTMLElement | null = null;

function esc(str: unknown): string {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function norm(str: string): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function showToast(msg: string): void {
  $toast.textContent = msg;
  $toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    $toast.classList.remove('show');
  }, 2400);
}

function getMyParty(): Partido | undefined {
  return PARTIDOS.find((p) => p.mio);
}

function findParty(sigla: string | null | undefined): Partido | undefined {
  if (!sigla) return undefined;
  return PARTIDOS.find((p) => p.sigla === sigla);
}

function renderPartyPill(sigla: string | null | undefined): string {
  const p = findParty(sigla);
  if (!p) return '';
  return `<button type="button" class="sigla-btn" data-open-party="${esc(p.sigla)}" style="background:${esc(p.color)}" aria-label="Ver partido ${esc(p.nombre)}">${esc(p.emoji)} ${esc(p.sigla)}</button>`;
}

function syncBadgeCounts(): void {
  const unreadNotif = NOTIFICACIONES.filter((n) => !n.leida).length;
  const unreadDm = CHATS_MD.reduce((acc, c) => acc + c.noLeidos, 0);

  const setBd = (id: string, val: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(val);
    el.hidden = val < 1;
  };

  setBd('bdTopNotif', unreadNotif);
  setBd('bdSideNotif', unreadNotif);
  setBd('bdTopDm', unreadDm);
  setBd('bdSideDm', unreadDm);

  const myParty = getMyParty();
  const sideLabel = document.getElementById('sidePartyChatLabel');
  if (sideLabel) {
    sideLabel.textContent = myParty ? `Chat ${myParty.sigla}` : 'Chat del partido';
  }
}

function syncMikeProfileParty(): void {
  const myParty = getMyParty();
  const wrap = document.getElementById('profPartyWrap');
  if (wrap) {
    wrap.innerHTML = myParty
      ? `<button type="button" class="badge-pill badge-pill-btn" data-open-party="${esc(myParty.sigla)}"><span>${esc(myParty.emoji)}</span><span>${esc(myParty.sigla)} · ${esc(myParty.nombre)}</span></button>`
      : '<span class="badge-pill"><span>🎗️</span><span>Sin militancia actual</span></span>';
  }
  INICIATIVAS.forEach((ini) => {
    if (ini.mia) ini.partido = myParty?.sigla;
  });
  MENSAJES_FORO.forEach((msg) => {
    if (msg.alias === 'Mike') msg.partido = myParty?.sigla;
  });
}

function switchPartyMembership(sigla: string): void {
  const target = findParty(sigla);
  if (!target) return;
  const current = getMyParty();

  if (current && current.sigla === target.sigla) {
    current.mio = false;
    current.miembros = Math.max(0, current.miembros - 1);
    current.militantesMuestra = current.militantesMuestra.filter((m) => m !== 'Mike');
    showToast(`Saliste de ${target.sigla} (demo)`);
  } else {
    if (current) {
      current.mio = false;
      current.miembros = Math.max(0, current.miembros - 1);
      current.militantesMuestra = current.militantesMuestra.filter((m) => m !== 'Mike');
    }
    target.mio = true;
    target.miembros += 1;
    if (!target.militantesMuestra.includes('Mike')) {
      target.militantesMuestra.splice(1, 0, 'Mike');
    }
    showToast(`Ahora militas en ${target.sigla} · ${target.nombre} (demo)`);
  }

  syncMikeProfileParty();
  render();
  if (state.activePartySigla) {
    renderPartyModalContent(state.activePartySigla);
  }
}

function renderPartyModalContent(sigla: string): void {
  const p = findParty(sigla);
  if (!p) return;

  $partyModalBox.style.borderTopColor = p.color;
  const myParty = getMyParty();
  const actionLabel = p.mio
    ? 'Salir del partido'
    : myParty
      ? 'Cambiarme a este partido'
      : '🎗️ Unirme a este partido';
  const actionClass = p.mio ? 'btn sec full' : 'btn full';
  const extraCount = Math.max(0, p.miembros - p.militantesMuestra.length);

  $partyModalBox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div class="party-hero-emoji" aria-hidden="true">${esc(p.emoji)}</div>
      <button type="button" class="btn sec mini" id="btnPartyTopClose" aria-label="Cerrar ficha de partido">✕</button>
    </div>
    <h2 class="d" id="partyModalTitle" style="margin:8px 0 6px">${esc(p.nombre)}</h2>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <span class="sigla" style="background:${esc(p.color)}">${esc(p.emoji)} ${esc(p.sigla)}</span>
      <span class="muted" style="font-size:13px;font-weight:700">Inscrito ✅</span>
    </div>
    <p style="font-size:16px;font-weight:800;margin:0 0 12px">«${esc(p.lema)}»</p>
    <h3 style="margin:0 0 6px">Programa</h3>
    <div class="party-program">
      ${p.programa.map((par) => `<p>${esc(par)}</p>`).join('')}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${p.mio ? `<button type="button" class="btn full" id="btnGoPartyChat">💬 Ir al chat interno de ${esc(p.sigla)}</button>` : ''}
      <button type="button" class="${actionClass}" id="btnPartyAction" data-party-action="${esc(p.sigla)}">${actionLabel}</button>
    </div>

    <div class="party-members">
      <h3 style="margin:0 0 8px">👥 Militantes (${p.miembros})</h3>
      <div>
        ${p.militantesMuestra
          .map((alias) => {
            const initial = esc(alias.trim().charAt(0).toUpperCase() || '?');
            const isPres = alias === p.presidente;
            return `<div class="member-row">
              <span class="member-avatar" aria-hidden="true">${initial}</span>
              <strong>${esc(alias)}</strong>
              ${alias === 'Mike' ? '<span class="muted" style="font-size:12px">(tú)</span>' : ''}
              ${isPres ? '<span class="chip gris">Presidente del partido</span>' : ''}
            </div>`;
          })
          .join('')}
      </div>
      ${extraCount > 0 ? `<p class="muted" style="font-size:12.5px;margin:8px 0 0">+ ${extraCount} militantes más en el padrón del partido (muestra demo).</p>` : ''}
    </div>

    <button type="button" class="btn sec full" id="btnClosePartyModal" style="margin-top:16px">Cerrar</button>
  `;

  const closeTop = document.getElementById('btnPartyTopClose');
  const closeBottom = document.getElementById('btnClosePartyModal');
  const actionBtn = document.getElementById('btnPartyAction');
  const goChatBtn = document.getElementById('btnGoPartyChat');

  if (closeTop) closeTop.addEventListener('click', closePartyModal);
  if (closeBottom) closeBottom.addEventListener('click', closePartyModal);
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      switchPartyMembership(p.sigla);
    });
  }
  if (goChatBtn) {
    goChatBtn.addEventListener('click', () => {
      $partyModal.hidden = true;
      state.activePartySigla = null;
      state.section = 'partido-chat';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function openPartyModal(sigla: string): void {
  if (!findParty(sigla)) return;
  lastFocusedBeforePartyModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  state.activePartySigla = sigla;
  renderPartyModalContent(sigla);
  $partyModal.hidden = false;
  const closeTop = document.getElementById('btnPartyTopClose') as HTMLButtonElement | null;
  if (closeTop) closeTop.focus();
}

function closePartyModal(): void {
  $partyModal.hidden = true;
  state.activePartySigla = null;
  if (lastFocusedBeforePartyModal) lastFocusedBeforePartyModal.focus();
}

function filterGroup(item: Iniciativa, f: FilterKey): boolean {
  if (f === 'apoyo') return item.estado === 'recogiendo' || item.estado === 'en_revision';
  if (f === 'nuevas') return item.estado === 'recogiendo';
  if (f === 'hab') return item.estado === 'aceptada';
  if (f === 'cer') return item.estado === 'rechazada' || item.estado === 'vencida' || item.estado === 'retirada';
  return item.mia;
}

function getFilteredIniciativas(): Iniciativa[] {
  const q = norm(state.query.trim());
  const list = INICIATIVAS.filter((x) => {
    if (!filterGroup(x, state.filter)) return false;
    if (!q) return true;
    const hay = norm(`${x.titulo} ${x.texto} ${x.alias} ${x.partido || ''} #ini${x.id} ${x.id}`);
    return hay.indexOf(q) >= 0;
  });

  list.sort((a, b) => {
    if (state.filter === 'apoyo') {
      const ar = a.estado === 'en_revision' ? 1 : 0;
      const br = b.estado === 'en_revision' ? 1 : 0;
      if (ar !== br) return ar - br;
      return b.apoyos / b.meta - a.apoyos / a.meta || b.id - a.id;
    }
    if (state.filter === 'hab') return b.apoyos - a.apoyos || b.id - a.id;
    return b.id - a.id;
  });
  return list;
}

function stateLabel(x: Iniciativa): { cls: string; txt: string } {
  if (x.estado === 'recogiendo') return { cls: '', txt: 'Juntando apoyos' };
  if (x.estado === 'en_revision') return { cls: 'rev', txt: '🔎 En revisión' };
  if (x.estado === 'aceptada') return { cls: 'hab', txt: '✅ Habilitada' };
  if (x.estado === 'rechazada') return { cls: 'cer', txt: '❌ No admitida' };
  if (x.estado === 'retirada') return { cls: 'cer', txt: 'Retirada' };
  return { cls: 'cer', txt: '⌛ Vencida' };
}

function renderInitiativeCard(x: Iniciativa): string {
  const st = stateLabel(x);
  const pct = Math.min(100, Math.round((100 * x.apoyos) / x.meta));
  const open = x.estado === 'recogiendo';
  const isHighlighted = state.highlightIniId === x.id;
  const pill = renderPartyPill(x.partido);
  let actionBtn = '';
  if (open && !x.mia) {
    actionBtn = `<button type="button" class="btn mini ${x.apoyada ? 'ok' : ''}" data-ap="${x.id}" aria-pressed="${x.apoyada}">${x.apoyada ? '✓ Apoyada' : '👍 Apoyar'}</button>`;
  } else if (open && x.mia) {
    actionBtn = `<button type="button" class="btn sec mini" data-ret="${x.id}">Retirar</button>`;
  }

  return `<article id="ini-card-${x.id}" class="ini-card${x.mia ? ' mine' : ''}${isHighlighted ? ' highlight' : ''}">
    <div class="ini-top">
      <span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong>${esc(x.alias)}</strong>${x.mia ? ' (tú)' : ''}${pill ? ` ${pill}` : ''}${open ? ` · quedan ${x.dias} días` : ''}
      </span>
      <span class="badge-state ${st.cls}">${st.txt}</span>
    </div>
    <div class="ini-title-row">
      <h3 class="ini-title">${esc(x.titulo)}</h3>
      <button type="button" class="btn sec mini" data-cit="${x.id}" aria-label="Copiar código #ini${x.id}">🔗 #ini${x.id}</button>
    </div>
    <p class="ini-text">${esc(x.texto)}</p>
    ${x.nota ? `<p class="ini-note">${esc(x.nota)}</p>` : ''}
    <div>
      <div class="progress-track"><div class="progress-fill${pct >= 100 ? ' full' : ''}" style="width:${pct}%"></div></div>
      <div class="ini-foot">
        <span><strong>${x.apoyos}</strong> de ${x.meta} apoyos (${pct}%)</span>
        ${actionBtn}
      </div>
    </div>
  </article>`;
}

function renderSkeletonCards(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<div class="skel-card" aria-hidden="true">
      <div class="skel-line w40"></div>
      <div class="skel-line w75"></div>
      <div class="skel-line w100"></div>
      <div class="skel-line w85"></div>
    </div>`;
  }
  return out;
}

function renderIniciativasHTML(isLegacy: boolean): string {
  const counts: Record<FilterKey, number> = {
    apoyo: INICIATIVAS.filter((x) => filterGroup(x, 'apoyo')).length,
    nuevas: INICIATIVAS.filter((x) => filterGroup(x, 'nuevas')).length,
    hab: INICIATIVAS.filter((x) => filterGroup(x, 'hab')).length,
    cer: INICIATIVAS.filter((x) => filterGroup(x, 'cer')).length,
    mias: INICIATIVAS.filter((x) => filterGroup(x, 'mias')).length
  };
  const pills: Array<{ k: FilterKey; txt: string }> = [
    { k: 'apoyo', txt: '🔥 Por llegar a la meta' },
    { k: 'nuevas', txt: '🆕 Nuevas' },
    { k: 'hab', txt: '✅ Habilitadas' },
    { k: 'cer', txt: '📁 Cerradas' },
    { k: 'mias', txt: '👤 Mías' }
  ];

  const filtered = getFilteredIniciativas();
  const visible = isLegacy ? filtered : filtered.slice(0, state.iniLimit);
  const remaining = filtered.length - visible.length;

  const cardsHtml = visible.length
    ? `<div class="grid-cards" id="iniGrid">${visible.map(renderInitiativeCard).join('')}${state.iniLoadingMore ? renderSkeletonCards(Math.min(2, remaining || 2)) : ''}</div>`
    : `<div class="empty-state">
        <h3>Sin resultados</h3>
        <p>No encontramos iniciativas que coincidan con tu búsqueda o filtro actual.</p>
        <button type="button" class="btn sec" id="btnClearEmpty">Limpiar búsqueda y filtros</button>
      </div>`;

  const searchHtml = isLegacy
    ? ''
    : `<div class="search-row">
        <div class="search-wrap">
          <label for="iniSearch" class="sr-only">Buscar iniciativas por palabra clave, autor o código</label>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input id="iniSearch" class="search-input" type="search" value="${esc(state.query)}" placeholder="Buscar por título, autor, partido o #ini616...">
          ${state.query ? '<button type="button" class="search-clear" id="btnClearSearch" aria-label="Limpiar búsqueda">✕</button>' : ''}
        </div>
      </div>`;

  const pagerHtml =
    !isLegacy && remaining > 0
      ? `<div class="pager">
          <span class="muted" style="font-size:13px">Mostrando ${visible.length} de ${filtered.length} iniciativas</span>
          <button type="button" class="btn sec" id="btnMoreIni">Cargar más (${remaining} restantes)</button>
        </div>`
      : visible.length
        ? `<p class="muted" style="text-align:center;font-size:13px;margin-top:16px">Mostrando ${visible.length} de ${filtered.length} iniciativas</p>`
        : '';

  return `<section aria-labelledby="secIniHead">
    <div class="card">
      <h2 id="secIniHead">📜 Iniciativas ciudadanas</h2>
      <p class="muted" style="font-size:14px;margin:0 0 12px">Cualquier ciudadano propone una medida. Si junta el apoyo del <strong>5 % de su Chile</strong> en 14 días, pasa a revisión del Árbitro y luego compite por el <strong>cupo ciudadano</strong> semanal.</p>
      <details class="propose-box" id="proposeDetails">
        <summary class="btn sec full">✍️ Proponer una iniciativa</summary>
        <form id="proposeForm" novalidate style="margin-top:12px">
          <div class="field">
            <label for="inTitulo"><span>Título</span><span id="cntTitulo">0/90</span></label>
            <input id="inTitulo" class="input" maxlength="90" placeholder="Ej: Tarifa plana en metro y buses regionales" required>
          </div>
          <div class="field">
            <label for="inTexto"><span>Propuesta, financiamiento y medición</span><span id="cntTexto">0/1200</span></label>
            <textarea id="inTexto" class="input" maxlength="1200" placeholder="Qué propones, por qué, cómo se pagaría y con qué indicador se mide (40 a 1.200 caracteres)" required></textarea>
          </div>
          <button type="submit" class="btn full" style="margin-top:12px">Publicar iniciativa</button>
          <p class="form-msg" id="proposeMsg" aria-live="polite"></p>
        </form>
      </details>
    </div>
    <div class="toolbar">
      ${searchHtml}
      <div class="filter-pills" role="group" aria-label="Filtrar iniciativas">
        ${pills.map((p) => `<button type="button" class="pill-btn${state.filter === p.k ? ' on' : ''}" data-filter="${p.k}" aria-pressed="${state.filter === p.k}">${p.txt} (${counts[p.k]})</button>`).join('')}
      </div>
    </div>
    <div class="results-meta">
      <span>${state.query ? `Resultados para «${esc(state.query)}»` : 'Haz clic en la pastilla de cualquier partido para ver su ficha completa'}</span>
      <span>Mostrando <strong>${visible.length}</strong> de <strong>${filtered.length}</strong></span>
    </div>
    ${cardsHtml}
    ${pagerHtml}
  </section>`;
}

function renderGobiernoHTML(isLegacy: boolean): string {
  const minItems = MINISTERIOS.map(
    (m) => `<div class="min-item${m.vocero ? ' voc' : ''}">
      <span>${esc(m.nombre)}${m.vocero ? ' <strong>(Vocería)</strong>' : ''}</span>
      <span class="muted">${m.titular ? esc(m.titular) : 'Sin nombrar'}</span>
    </div>`
  ).join('');

  const minSection = isLegacy
    ? `<div class="card">
        <h3>🏛️ Ministerios de tu Chile</h3>
        <p class="muted" style="font-size:13.5px;margin:0 0 8px">25 ministerios, los mismos del Chile real. En la vista actual aparecen todos desplegados en 1 columna antes de llegar a las iniciativas.</p>
        <div class="min-grid">${minItems}</div>
      </div>`
    : `<div class="card">
        <details id="minDetails"${state.minOpen ? ' open' : ''}>
          <summary class="min-summary">
            <span>🏛️ Ministerios de tu Chile · <span class="muted">0/25 nombrados</span></span>
            <span class="btn sec mini">${state.minOpen ? 'Ocultar los 25' : 'Ver los 25'}</span>
          </summary>
          <p class="muted" style="font-size:13.5px;margin:8px 0 0">Al mantenerse plegado por defecto cuando no hay nombramientos, se ahorran más de 1.100 px de scroll vertical.</p>
          <div class="min-grid">${minItems}</div>
        </details>
      </div>`;

  return `<section aria-labelledby="secGobHead">
    <div class="card soft">
      <h2 id="secGobHead">Todavía no hay Presidente.</h2>
      <p class="muted" style="margin:0;font-size:14px">Los primeros meses gobierna el plan de choque, que votan todos. Después cualquiera se puede presentar: quien gana nombra a sus 25 ministros.</p>
    </div>
    ${minSection}
  </section>`;
}

function renderEleccionesHTML(isLegacy: boolean): string {
  const visible = isLegacy ? CANDIDATOS : CANDIDATOS.slice(0, state.candLimit);
  const remaining = CANDIDATOS.length - visible.length;

  const cards = visible
    .map((c, idx) => {
      const sup = state.supportedCandId === c.id;
      const pill = renderPartyPill(c.partido);
      return `<article class="cand-card${sup ? ' supported' : ''}">
        <div>
          <div class="cand-head">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <strong>${idx + 1}. ${esc(c.alias)}</strong>
              ${pill}
            </div>
            <span class="mono" style="font-size:13px">▲ ${c.apoyos + (sup ? 1 : 0)}</span>
          </div>
          <p class="muted" style="margin:8px 0 0;font-size:14px">«${esc(c.lema)}»</p>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn sec mini" style="flex:1" data-cand-info="${c.id}">Ver y preguntar</button>
          <button type="button" class="btn mini ${sup ? 'ok' : ''}" style="flex:1" data-cand-ap="${c.id}" aria-pressed="${sup}">${sup ? '✓ Apoyado' : 'Apoyar'}</button>
        </div>
      </article>`;
    })
    .join('');

  const pager =
    !isLegacy && remaining > 0
      ? `<div class="pager">
          <span class="muted" style="font-size:13px">Mostrando ${visible.length} de ${CANDIDATOS.length} candidaturas</span>
          <button type="button" class="btn sec" id="btnMoreCand">Cargar más candidaturas (${remaining} restantes)</button>
        </div>`
      : '';

  return `<section aria-labelledby="secEleHead">
    <div class="card soft">
      <h2 id="secEleHead">🗳️ Primera elección presidencial</h2>
      <p class="muted" style="margin:0;font-size:14px">Cada ciudadano entrega <strong>un apoyo</strong> (puedes cambiarlo hasta el cierre). Toca la pastilla de partido junto a cada candidatura para ver su programa y militantes.</p>
    </div>
    <div class="grid-cards">${cards}</div>
    ${pager}
  </section>`;
}

function renderPartidosHTML(): string {
  const myParty = getMyParty();
  const cards = PARTIDOS.map(
    (p) => `<article class="party-card" style="border-left-color:${esc(p.color)}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${renderPartyPill(p.sigla)}
          <strong>${esc(p.nombre)}</strong>
          ${p.mio ? ' <span class="chip gris">Tu partido</span>' : ''}
        </div>
        <strong class="mono">${p.miembros} 👥</strong>
      </div>
      <p class="muted" style="margin:0;font-size:13.5px">«${esc(p.lema)}»</p>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap">
        <span style="font-size:12.5px;font-weight:700;color:var(--ok)">Inscrito ✅ · Preside ${esc(p.presidente)}</span>
        <div style="display:flex;gap:6px">
          ${p.mio ? '<button type="button" class="btn mini" data-go="partido-chat">💬 Chat interno</button>' : ''}
          <button type="button" class="btn sec mini" data-open-party="${esc(p.sigla)}">Ver ficha</button>
        </div>
      </div>
    </article>`
  ).join('');

  return `<section aria-labelledby="secParHead">
    <div class="card soft">
      <h2 id="secParHead">🎗️ Partidos de tu Chile</h2>
      <p class="muted" style="margin:0;font-size:14px">${
        myParty
          ? `Militas en <strong>${esc(myParty.sigla)} · ${esc(myParty.nombre)}</strong>.`
          : 'Actualmente no militas en ningún partido.'
      } Con 10 militantes un partido queda inscrito oficialmente.</p>
    </div>
    <div class="grid-cards">${cards}</div>
  </section>`;
}

function renderPoliticaHTML(isLegacy: boolean): string {
  const subtabsHtml = `<nav class="subtabs" aria-label="Secciones de Política" id="subtabs">
    <button type="button" class="subtab-btn${state.subtab === 'iniciativas' ? ' on' : ''}" data-sub="iniciativas" aria-pressed="${state.subtab === 'iniciativas'}">
      <span>Iniciativas</span><span class="count-pill">${INICIATIVAS.length}</span>
    </button>
    <button type="button" class="subtab-btn${state.subtab === 'gobierno' ? ' on' : ''}" data-sub="gobierno" aria-pressed="${state.subtab === 'gobierno'}">
      <span>Gobierno</span><span class="count-pill">0/25</span>
    </button>
    <button type="button" class="subtab-btn${state.subtab === 'elecciones' ? ' on' : ''}" data-sub="elecciones" aria-pressed="${state.subtab === 'elecciones'}">
      <span>Elecciones</span><span class="count-pill">${CANDIDATOS.length}</span>
    </button>
    <button type="button" class="subtab-btn${state.subtab === 'partidos' ? ' on' : ''}" data-sub="partidos" aria-pressed="${state.subtab === 'partidos'}">
      <span>Partidos</span><span class="count-pill">${PARTIDOS.length}</span>
    </button>
  </nav>`;

  let content = '';
  if (isLegacy) {
    content =
      renderGobiernoHTML(true) +
      '<div class="legacy-stack-gap"></div>' +
      renderEleccionesHTML(true) +
      '<div class="legacy-stack-gap"></div>' +
      renderPartidosHTML() +
      '<div class="legacy-stack-gap"></div>' +
      renderIniciativasHTML(true);
  } else if (state.subtab === 'iniciativas') {
    content = renderIniciativasHTML(false);
  } else if (state.subtab === 'gobierno') {
    content = renderGobiernoHTML(false);
  } else if (state.subtab === 'elecciones') {
    content = renderEleccionesHTML(false);
  } else {
    content = renderPartidosHTML();
  }

  return `${subtabsHtml}<div>${content}</div>`;
}

function renderInicioHTML(): string {
  const mine = INICIATIVAS.filter((x) => x.mia).slice(0, 3);
  const myParty = getMyParty();
  return `<div class="grid-cards">
    <article class="card banner-dark" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
      <div>
        <span class="chip izquierda">Votación abierta</span>
        <h2 style="margin-top:10px;color:#FFFFFF">Plan de choque · Reforma previsional</h2>
        <p style="margin:0;color:#CBD5E1;font-size:14px">Consulta demo para comparar las 4 opciones con su evidencia y riesgos antes del cierre.</p>
      </div>
      <button type="button" class="btn sec full" data-go="votar">Ir a votar →</button>
    </article>

    <article class="card" style="margin:0">
      <div class="muted" style="font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">Marcador semanal · Temporada 1</div>
      <h2 style="margin-top:4px">Chile Izquierda vs Derecha</h2>
      <div class="score-grid" style="margin:14px 0">
        <div>
          <div class="score-big score-iz">50</div>
          <div class="muted" style="font-size:12.5px">Cohesión social</div>
        </div>
        <div class="mono muted">VS</div>
        <div>
          <div class="score-big score-de">50</div>
          <div class="muted" style="font-size:12.5px">Cohesión social</div>
        </div>
      </div>
      <p class="muted" style="margin:0;font-size:13.5px">Ambos países parten iguales con los datos reales de noviembre 2026.</p>
    </article>

    <article class="card soft" style="margin:0">
      <h3>Accesos rápidos</h3>
      <div class="quick-links" style="margin-top:10px">
        <button type="button" class="quick-btn" data-go="politica"><span><strong>🏛️ Política e iniciativas</strong><br><span class="muted" style="font-size:13px">${INICIATIVAS.length} iniciativas · ${CANDIDATOS.length} candidaturas</span></span><span>→</span></button>
        <button type="button" class="quick-btn" data-go="partido-chat"><span><strong>🎗️ Chat interno ${myParty ? esc(myParty.sigla) : 'del partido'}</strong><br><span class="muted" style="font-size:13px">Conversación privada entre militantes</span></span><span>→</span></button>
        <button type="button" class="quick-btn" data-go="mensajes"><span><strong>✉️ Mensajes privados (MD)</strong><br><span class="muted" style="font-size:13px">Conversaciones directas 1 a 1</span></span><span>→</span></button>
      </div>
    </article>

    <article class="card soft" style="margin:0">
      <h3>Tus iniciativas recientes</h3>
      <div class="quick-links" style="margin-top:10px">
        ${mine
          .map(
            (m) => `<button type="button" class="quick-btn" data-jump-ini="${m.id}">
              <span><strong>#ini${m.id}</strong> · ${esc(m.titulo)}<br><span class="muted" style="font-size:12.5px">${m.apoyos} de ${m.meta} apoyos · ${stateLabel(m).txt}</span></span>
              <span>→</span>
            </button>`
          )
          .join('')}
      </div>
    </article>
  </div>`;
}

function renderVotarHTML(): string {
  const optionsHtml = OPCIONES_VOTO.map((op) => {
    const sel = state.selectedBallot === op.id;
    return `<div class="opt-card${sel ? ' sel' : ''}">
      <button type="button" class="opt-head-btn" data-ballot="${op.id}" aria-pressed="${sel}">
        <span class="opt-radio" aria-hidden="true"></span>
        <span>
          <strong style="display:block">${esc(op.titulo)}</strong>
          <span class="muted" style="font-size:13.5px">${esc(op.resumen)}</span>
        </span>
      </button>
      <details style="margin-top:10px">
        <summary style="cursor:pointer;font-weight:700;font-size:13.5px;color:var(--blue-ink)">Ver efectos seguros, riesgos y calidad de evidencia</summary>
        <ul class="ev-list">
          ${op.efectos.map((ef) => `<li><span class="ev-q">${ef.calidad}</span><span>${esc(ef.detalle)}</span></li>`).join('')}
        </ul>
      </details>
    </div>`;
  }).join('');

  const resultsHtml = state.votedBallot
    ? `<div class="card" style="border-color:var(--ok)">
        <div style="font-weight:800;color:var(--ok);margin-bottom:8px">✓ Voto demo registrado (secreto)</div>
        ${OPCIONES_VOTO.map(
          (op) => `<div class="res-bar-wrap">
            <div class="res-bar-top"><span>${esc(op.titulo)}</span><span class="mono">${op.votosPct}%</span></div>
            <div class="progress-track"><div class="progress-fill${op.id === state.selectedBallot ? ' full' : ''}" style="width:${op.votosPct}%"></div></div>
          </div>`
        ).join('')}
      </div>`
    : '';

  return `<section aria-labelledby="secVotHead">
    <div class="card soft">
      <h2 id="secVotHead">🗳️ Plan de choque · Consulta de ejemplo (Pensiones)</h2>
      <p class="muted" style="margin:0;font-size:14px">Una persona, un voto secreto. Calidad de evidencia: <strong>A</strong> organismos oficiales · <strong>B</strong> estudios causales · <strong>C</strong> correlaciones.</p>
    </div>
    ${optionsHtml}
    <button type="button" class="btn full" id="btnCastVote" style="margin-bottom:16px">${state.votedBallot ? 'Actualizar mi voto (demo)' : 'Emitir voto (demo)'}</button>
    ${resultsHtml}
  </section>`;
}

function renderPaisHTML(): string {
  const kpisHtml = KPIS_PAIS.map(
    (k) => `<article class="kpi-card">
      <div class="muted" style="font-size:13px;font-weight:800">${esc(k.nombre)}</div>
      <div class="kpi-val">${esc(k.val)}</div>
      <div class="kpi-src">${esc(k.fuente)}</div>
    </article>`
  ).join('');

  const thermoHtml = TERMOMETRO.map(
    (t) => `<div class="thermo-row">
      <div class="thermo-top"><span>${esc(t.nombre)}</span><span class="mono">${t.val} / 100</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${t.val}%"></div></div>
    </div>`
  ).join('');

  return `<section aria-labelledby="secPaisHead">
    <div class="card soft">
      <h2 id="secPaisHead">📊 Estado base · Temporada 1, Año 0</h2>
      <p class="muted" style="margin:0;font-size:14px">Datos reales de partida al 11 de noviembre de 2026 (iguales para ambos Chiles).</p>
    </div>
    <div class="kpi-grid">${kpisHtml}</div>
    <div class="grid-cards">
      <article class="card" style="margin:0">
        <h3>🌡️ Termómetro social</h3>
        <p class="muted" style="margin:0;font-size:13.5px">Índices propios de 0 a 100. Todos parten en 50.</p>
        ${thermoHtml}
      </article>
      <article class="card soft" style="margin:0">
        <h3>🎲 Azar verificable con el Loto</h3>
        <p class="muted" style="font-size:14px">Cuando cierra una votación, los riesgos quedan pendientes y su lista se sella con huella <span class="mono">SHA-256</span> antes del sorteo del Loto (mar, jue y dom 21:00). Nadie puede alterar las probabilidades después.</p>
        <div class="ini-note mono" style="font-size:12px">Huella demo: 8f9c2a…e41b (sellada antes del sorteo)</div>
      </article>
    </div>
  </section>`;
}

function formatForoTexto(texto: string): string {
  return esc(texto).replace(
    /#ini(\d{1,7})\b/gi,
    '<button type="button" class="ini-jump-btn" data-jump-ini="$1">📜 #ini$1</button>'
  );
}

function renderForoHTML(): string {
  const myParty = getMyParty();
  const msgs = MENSAJES_FORO.filter((m) => m.canal === state.activeChannel);
  const partyPinBtn = myParty
    ? `<button type="button" class="chan-btn" data-go="partido-chat" style="border-color:${esc(myParty.color)}">
        <span aria-hidden="true">${esc(myParty.emoji)}</span>
        <span>Chat interno ${esc(myParty.sigla)}</span>
      </button>`
    : '';
  const channelsHtml =
    partyPinBtn +
    CANALES_FORO.map(
      (c) => `<button type="button" class="chan-btn${state.activeChannel === c.id ? ' on' : ''}" data-chan="${c.id}" aria-pressed="${state.activeChannel === c.id}">
        <span aria-hidden="true">${c.icono}</span>
        <span>${esc(c.nombre)}</span>
      </button>`
    ).join('');

  const msgsHtml = msgs
    .map(
      (m) => `<article class="msg-card">
        <div class="msg-head">
          <strong>${esc(m.alias)}</strong>
          ${renderPartyPill(m.partido)}
          <span class="muted">${esc(m.hace)}</span>
        </div>
        <p style="margin:0 0 10px;font-size:14.5px">${formatForoTexto(m.texto)}</p>
        <button type="button" class="btn sec mini" data-like-msg="${m.id}" aria-pressed="${!!m.liked}">👍 ${m.likes + (m.liked ? 1 : 0)}</button>
      </article>`
    )
    .join('');

  return `<div class="foro-shell">
    <nav class="foro-channels" aria-label="Canales del foro">${channelsHtml}</nav>
    <div>
      <div class="card" style="margin-bottom:16px">
        <form id="foroForm" novalidate>
          <div class="field" style="margin-top:0">
            <label for="foroInput"><span>Publicar en este canal (prueba citar #ini616)</span></label>
            <textarea id="foroInput" class="input" style="min-height:76px" maxlength="500" placeholder="Escribe una idea o cita una iniciativa con #ini616..."></textarea>
          </div>
          <button type="submit" class="btn mini" style="margin-top:8px">Publicar mensaje (demo)</button>
        </form>
      </div>
      ${msgsHtml || '<div class="empty-state"><p>No hay mensajes en este canal todavía.</p></div>'}
    </div>
  </div>`;
}

function renderNotificacionesHTML(): string {
  const unread = NOTIFICACIONES.filter((n) => !n.leida).length;
  return `<section aria-labelledby="secNotifHead">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px">
      <span id="secNotifHead" class="muted" style="font-size:14px">${unread ? `Tienes <strong>${unread}</strong> notificaciones sin leer` : 'Estás al día'}</span>
      ${unread ? '<button type="button" class="btn sec mini" id="btnMarkAllNotif">✓ Marcar todas como leídas</button>' : ''}
    </div>
    <div class="notif-list">
      ${NOTIFICACIONES.map(
        (n) => `<button type="button" class="notif-item${n.leida ? '' : ' unread'}" data-notif-id="${n.id}">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:20px;line-height:1" aria-hidden="true">${n.icono}</span>
            <div>
              <strong style="display:block">${esc(n.titulo)}</strong>
              <span class="muted" style="font-size:13.5px">${esc(n.detalle)}</span>
            </div>
          </div>
          <span class="muted" style="font-size:12px;white-space:nowrap">${esc(n.hace)}</span>
        </button>`
      ).join('')}
    </div>
  </section>`;
}

function renderMensajesHTML(): string {
  const activeChat = CHATS_MD.find((c) => c.id === state.activeChatId) || CHATS_MD[0];
  const threadsHtml = CHATS_MD.map(
    (c) => `<div class="dm-thread-card${c.id === activeChat?.id ? ' on' : ''}" role="listitem">
      <div class="dm-thread-top">
        <button type="button" class="dm-thread-main" data-dm-thread="${c.id}">
          <strong>${esc(c.alias)}</strong>
        </button>
        <div class="dm-thread-aside">
          ${renderPartyPill(c.partido)}
          ${c.noLeidos ? `<span class="side-bd" style="margin-left:0">${c.noLeidos}</span>` : ''}
        </div>
      </div>
      <div class="dm-preview">${esc(c.mensajes[c.mensajes.length - 1]?.texto || 'Sin mensajes aún')}</div>
    </div>`
  ).join('');

  const availableContacts = CANDIDATOS.filter(
    (cand) => !CHATS_MD.some((c) => c.alias === cand.alias)
  ).slice(0, 6);

  return `<div class="dm-shell">
    <div>
      <details class="card soft" style="margin-bottom:12px;padding:12px">
        <summary style="cursor:pointer;font-weight:800;font-size:13.5px">➕ Nuevo mensaje privado</summary>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
          ${availableContacts
            .map(
              (c) => `<button type="button" class="btn sec mini" data-new-dm="${esc(c.alias)}">${esc(c.alias)}</button>`
            )
            .join('')}
        </div>
      </details>
      <div class="dm-threads" role="list" aria-label="Conversaciones privadas">${threadsHtml}</div>
    </div>

    ${
      activeChat
        ? `<div class="dm-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:10px;border-bottom:1px solid var(--line)">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <strong style="font-size:16px">${esc(activeChat.alias)}</strong>
                ${renderPartyPill(activeChat.partido)}
              </div>
              <span class="muted" style="font-size:12px">Chat privado 1 a 1</span>
            </div>
            <div class="dm-bubbles" id="dmBubbles">
              ${activeChat.mensajes
                .map(
                  (m) => `<div class="bub${m.mio ? ' mio' : ''}">
                    <span>${formatForoTexto(m.texto)}</span>
                    <span class="bub-time">${esc(m.hace)}</span>
                  </div>`
                )
                .join('')}
            </div>
            <form class="dm-compose" id="dmForm" novalidate>
              <label for="dmInput" class="sr-only">Escribir mensaje privado</label>
              <input id="dmInput" class="input" maxlength="400" placeholder="Escribe un mensaje a ${esc(activeChat.alias)}...">
              <button type="submit" class="btn">Enviar</button>
            </form>
          </div>`
        : ''
    }
  </div>`;
}

function renderPartidoChatHTML(): string {
  const myParty = getMyParty();
  if (!myParty) {
    return `<div class="empty-state">
      <h3>No militas en ningún partido</h3>
      <p>Únete a un partido o funda el tuyo para acceder a su chat interno privado.</p>
      <button type="button" class="btn" id="btnGoPartidos">Ver partidos de tu Chile</button>
    </div>`;
  }

  const msgs = CHATS_PARTIDO[myParty.sigla] || [];
  return `<section aria-labelledby="secPartyChatHead">
    <div class="party-chat-banner" style="border-left-color:${esc(myParty.color)}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${renderPartyPill(myParty.sigla)}
            <strong id="secPartyChatHead" style="font-size:17px">${esc(myParty.nombre)}</strong>
          </div>
          <p class="muted" style="margin:6px 0 0;font-size:13.5px">Chat interno exclusivo · solo lo ven los ${myParty.miembros} militantes de ${esc(myParty.sigla)}.</p>
        </div>
        <button type="button" class="btn sec mini" data-open-party="${esc(myParty.sigla)}">Ver padrón y programa</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <form id="partyChatForm" novalidate>
        <div class="field" style="margin-top:0">
          <label for="partyChatInput"><span>Mensaje para la militancia de ${esc(myParty.sigla)}</span></label>
          <textarea id="partyChatInput" class="input" style="min-height:76px" maxlength="500" placeholder="Coordina apoyos, candidaturas o cita #ini616..."></textarea>
        </div>
        <button type="submit" class="btn mini" style="margin-top:8px">Enviar al partido (demo)</button>
      </form>
    </div>

    ${
      msgs.length
        ? msgs
            .map(
              (m) => `<article class="msg-card">
                <div class="msg-head">
                  <strong>${esc(m.alias)}</strong>
                  ${m.alias === 'Mike' ? '<span class="muted">(tú)</span>' : ''}
                  ${m.rol ? `<span class="chip gris">${esc(m.rol)}</span>` : ''}
                  <span class="muted">${esc(m.hace)}</span>
                </div>
                <p style="margin:0;font-size:14.5px">${formatForoTexto(m.texto)}</p>
              </article>`
            )
            .join('')
        : '<div class="empty-state"><p>Todavía no hay mensajes en este partido.</p></div>'
    }
  </section>`;
}

function renderMasHTML(): string {
  return `<div class="grid-cards">
    <article class="card" style="margin:0">
      <h3>👤 Tu perfil ciudadano</h3>
      <p class="muted" style="font-size:14px">Revisa tu tendencia, actividad e insignias acumuladas en la temporada.</p>
      <button type="button" class="btn full" id="btnMasProfile">Abrir ficha de Mike</button>
    </article>

    <article class="card soft" style="margin:0">
      <h3>🧩 Sobre esta propuesta UX/UI</h3>
      <p class="muted" style="font-size:14px;margin:0">Rediseño focalizado en desktop sin perder compatibilidad móvil: sidebar persistente en >=1024px con accesos directos a Notificaciones, MD y Chat de partido, sub-pestañas en Política, ministerios plegables y paginación incremental.</p>
    </article>

    <article class="card soft" style="margin:0">
      <details>
        <summary class="min-summary"><span>📜 Normas de convivencia</span><span class="btn sec mini">Leer</span></summary>
        <ul style="margin:10px 0 0;padding-left:18px;font-size:14px">
          <li>Se debaten ideas, no personas: cero insultos ni amenazas.</li>
          <li>Nada de políticos ni partidos reales.</li>
          <li>Nada de sabotear el otro Chile desde dentro.</li>
        </ul>
      </details>
    </article>

    <article class="card soft" style="margin:0">
      <details>
        <summary class="min-summary"><span>🔒 Privacidad del mock</span><span class="btn sec mini">Leer</span></summary>
        <p class="muted" style="margin:10px 0 0;font-size:14px">Este mock corre 100 % en memoria local del navegador con datos de ejemplo; no envía formularios ni usa trackers.</p>
      </details>
    </article>
  </div>`;
}

function sectionMeta(isLegacy: boolean): { title: string; sub: string } {
  if (state.section === 'politica') {
    return {
      title: 'Gobierno de tu Chile',
      sub: isLegacy
        ? 'Vista actual: columna de 720px en desktop, barra inferior móvil, 25 ministerios desplegados y listas completas sin paginar.'
        : 'Vista optimizada: navegación lateral en desktop, sub-pestañas en Política, grilla de 2 columnas y paginación incremental.'
    };
  }
  if (state.section === 'inicio') return { title: 'Inicio', sub: 'Resumen de temporada, votación activa y accesos directos.' };
  if (state.section === 'votar') return { title: 'Votaciones', sub: 'Cada opción muestra sus efectos seguros, riesgos y evidencia.' };
  if (state.section === 'pais') return { title: 'Tu Chile en datos', sub: 'Indicadores macroeconómicos oficiales y termómetro social.' };
  if (state.section === 'foro') return { title: 'Foro de tu Chile', sub: 'Canales por tema con enlaces directos a iniciativas (#iniXXX).' };
  if (state.section === 'notificaciones') return { title: 'Notificaciones', sub: 'Respuestas, menciones, metas de iniciativas y avisos del juego.' };
  if (state.section === 'mensajes') return { title: 'Mensajes privados (MD)', sub: 'Conversaciones directas 1 a 1 con ciudadanos de tu Chile.' };
  if (state.section === 'partido-chat') {
    const myParty = getMyParty();
    return {
      title: myParty ? `Chat interno · ${myParty.sigla}` : 'Chat del partido',
      sub: 'Espacio privado para coordinar propuestas y candidaturas con tu partido.'
    };
  }
  return { title: 'Más opciones', sub: 'Perfil ciudadano, normas y notas de esta propuesta UX.' };
}

function render(): void {
  const isLegacy = state.mode === 'legacy';
  document.body.classList.toggle('mode-legacy', isLegacy);

  const mineCount = INICIATIVAS.filter((x) => x.mia).length;
  const profCount = document.getElementById('profIniCount');
  if (profCount) profCount.textContent = String(mineCount);
  syncMikeProfileParty();
  syncBadgeCounts();

  $btnModeProp.setAttribute('aria-pressed', isLegacy ? 'false' : 'true');
  $btnModeLegacy.setAttribute('aria-pressed', isLegacy ? 'true' : 'false');
  $modeBadge.textContent = isLegacy ? 'Actual 720px' : 'Desktop 1180px';

  document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
    const active = btn.dataset.nav === state.section;
    btn.classList.toggle('on', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  const meta = sectionMeta(isLegacy);
  let bodyHtml = '';
  if (state.section === 'politica') bodyHtml = renderPoliticaHTML(isLegacy);
  else if (state.section === 'inicio') bodyHtml = renderInicioHTML();
  else if (state.section === 'votar') bodyHtml = renderVotarHTML();
  else if (state.section === 'pais') bodyHtml = renderPaisHTML();
  else if (state.section === 'foro') bodyHtml = renderForoHTML();
  else if (state.section === 'notificaciones') bodyHtml = renderNotificacionesHTML();
  else if (state.section === 'mensajes') bodyHtml = renderMensajesHTML();
  else if (state.section === 'partido-chat') bodyHtml = renderPartidoChatHTML();
  else bodyHtml = renderMasHTML();

  $root.innerHTML = `<div class="page-head">
      <div>
        <h1 class="d">${esc(meta.title)}</h1>
        <p class="page-sub">${esc(meta.sub)}</p>
      </div>
    </div>
    <div class="compare-note">
      <span><strong>Comparador activo:</strong> alterna arriba entre <b>Propuesta UX</b> y <b>Vista actual (720px)</b> para ver el antes y después en desktop.</span>
    </div>
    ${bodyHtml}`;

  bindDynamicEvents();
}

function jumpToInitiative(id: number): void {
  const found = INICIATIVAS.find((x) => x.id === id);
  state.section = 'politica';
  state.subtab = 'iniciativas';
  state.query = '';
  if (found) {
    if (found.estado === 'recogiendo' || found.estado === 'en_revision') state.filter = 'apoyo';
    else if (found.estado === 'aceptada') state.filter = 'hab';
    else state.filter = 'cer';
  }
  const filtered = getFilteredIniciativas();
  const idx = filtered.findIndex((x) => x.id === id);
  if (idx >= 0 && idx >= state.iniLimit) {
    state.iniLimit = idx + 2;
  }
  state.highlightIniId = id;
  render();
  const card = document.getElementById(`ini-card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  showToast(found ? `Mostrando #ini${id}` : `No se encontró #ini${id} en los datos demo`);
}

function bindDynamicEvents(): void {
  const subtabs = document.getElementById('subtabs');
  if (subtabs) {
    subtabs.querySelectorAll<HTMLButtonElement>('[data-sub]').forEach((b) => {
      b.onclick = () => {
        state.subtab = (b.dataset.sub as PoliticaSubtab) || 'iniciativas';
        render();
      };
    });
  }

  const minDetails = document.getElementById('minDetails') as HTMLDetailsElement | null;
  if (minDetails) {
    minDetails.addEventListener('toggle', () => {
      state.minOpen = minDetails.open;
      const labelBtn = minDetails.querySelector('.min-summary .btn');
      if (labelBtn) labelBtn.textContent = state.minOpen ? 'Ocultar los 25' : 'Ver los 25';
    });
  }

  const searchInput = document.getElementById('iniSearch') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value;
      const caret = searchInput.selectionStart ?? val.length;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.query = val;
        state.iniLimit = 6;
        state.highlightIniId = null;
        render();
        const nextInput = document.getElementById('iniSearch') as HTMLInputElement | null;
        if (nextInput) {
          nextInput.focus();
          try {
            nextInput.setSelectionRange(caret, caret);
          } catch {
            // ignore on non-selectable inputs
          }
        }
      }, 180);
    });
  }

  const btnClearSearch = document.getElementById('btnClearSearch');
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      state.query = '';
      state.iniLimit = 6;
      render();
      const nextInput = document.getElementById('iniSearch') as HTMLInputElement | null;
      if (nextInput) nextInput.focus();
    });
  }

  const btnClearEmpty = document.getElementById('btnClearEmpty');
  if (btnClearEmpty) {
    btnClearEmpty.addEventListener('click', () => {
      state.query = '';
      state.filter = 'apoyo';
      state.iniLimit = 6;
      render();
    });
  }

  $root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => {
    b.onclick = () => {
      state.filter = (b.dataset.filter as FilterKey) || 'apoyo';
      state.iniLimit = 6;
      state.highlightIniId = null;
      render();
    };
  });

  const btnMoreIni = document.getElementById('btnMoreIni');
  if (btnMoreIni) {
    btnMoreIni.addEventListener('click', () => {
      state.iniLoadingMore = true;
      render();
      window.setTimeout(() => {
        state.iniLoadingMore = false;
        state.iniLimit += 6;
        render();
      }, 180);
    });
  }

  const btnMoreCand = document.getElementById('btnMoreCand');
  if (btnMoreCand) {
    btnMoreCand.addEventListener('click', () => {
      state.candLimit += 6;
      render();
    });
  }

  $root.querySelectorAll<HTMLButtonElement>('[data-ap]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.ap);
      const item = INICIATIVAS.find((x) => x.id === id);
      if (!item) return;
      item.apoyada = !item.apoyada;
      item.apoyos += item.apoyada ? 1 : -1;
      showToast(item.apoyada ? `Apoyo sumado a #ini${id}` : `Apoyo quitado de #ini${id}`);
      render();
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-ret]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.ret);
      const item = INICIATIVAS.find((x) => x.id === id);
      if (!item) return;
      item.estado = 'retirada';
      showToast(`Iniciativa #ini${id} retirada (demo)`);
      render();
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-cit]').forEach((b) => {
    b.onclick = () => {
      const code = `#ini${b.dataset.cit ?? ''}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
      showToast(`Código ${code} copiado`);
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-cand-ap]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.candAp);
      state.supportedCandId = state.supportedCandId === id ? null : id;
      showToast(state.supportedCandId ? 'Apoyo presidencial actualizado' : 'Apoyo retirado');
      render();
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-cand-info]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.candInfo);
      const cand = CANDIDATOS.find((c) => c.id === id);
      if (cand) showToast(`Ficha de ${cand.alias} · mock interactivo`);
    };
  });

  const form = document.getElementById('proposeForm') as HTMLFormElement | null;
  if (form) {
    const inTi = document.getElementById('inTitulo') as HTMLInputElement;
    const inTx = document.getElementById('inTexto') as HTMLTextAreaElement;
    const cntTi = document.getElementById('cntTitulo') as HTMLElement;
    const cntTx = document.getElementById('cntTexto') as HTMLElement;
    const msgEl = document.getElementById('proposeMsg') as HTMLElement;

    inTi.addEventListener('input', () => {
      cntTi.textContent = `${inTi.value.length}/90`;
    });
    inTx.addEventListener('input', () => {
      cntTx.textContent = `${inTx.value.length}/1200`;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ti = inTi.value.trim();
      const tx = inTx.value.trim();
      if (ti.length < 8 || ti.length > 90) {
        msgEl.className = 'form-msg err';
        msgEl.textContent = 'El título debe tener entre 8 y 90 caracteres.';
        inTi.focus();
        return;
      }
      if (tx.length < 40 || tx.length > 1200) {
        msgEl.className = 'form-msg err';
        msgEl.textContent = 'La explicación debe tener entre 40 y 1.200 caracteres.';
        inTx.focus();
        return;
      }
      const newId = state.nextId++;
      INICIATIVAS.unshift({
        id: newId,
        alias: 'Mike',
        partido: getMyParty()?.sigla,
        mia: true,
        estado: 'recogiendo',
        dias: 14,
        apoyos: 1,
        meta: 150,
        apoyada: false,
        titulo: ti,
        texto: tx
      });
      state.filter = 'mias';
      state.query = '';
      state.iniLimit = 6;
      state.highlightIniId = newId;
      showToast(`Iniciativa #ini${newId} publicada en Mías`);
      render();
    });
  }

  $root.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => {
    b.onclick = () => {
      state.section = (b.dataset.go as MainSection) || 'politica';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-jump-ini]').forEach((b) => {
    b.onclick = () => {
      jumpToInitiative(Number(b.dataset.jumpIni));
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-ballot]').forEach((b) => {
    b.onclick = () => {
      state.selectedBallot = b.dataset.ballot || 'b';
      render();
    };
  });

  const btnCastVote = document.getElementById('btnCastVote');
  if (btnCastVote) {
    btnCastVote.addEventListener('click', () => {
      state.votedBallot = true;
      showToast('Voto demo registrado');
      render();
    });
  }

  $root.querySelectorAll<HTMLButtonElement>('[data-chan]').forEach((b) => {
    b.onclick = () => {
      state.activeChannel = b.dataset.chan || 'general';
      render();
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-like-msg]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.likeMsg);
      const m = MENSAJES_FORO.find((x) => x.id === id);
      if (!m) return;
      m.liked = !m.liked;
      render();
    };
  });

  const foroForm = document.getElementById('foroForm') as HTMLFormElement | null;
  if (foroForm) {
    foroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('foroInput') as HTMLTextAreaElement;
      const texto = input.value.trim();
      if (texto.length < 2) {
        showToast('Escribe al menos 2 caracteres');
        return;
      }
      MENSAJES_FORO.unshift({
        id: state.nextMsgId++,
        canal: state.activeChannel,
        alias: 'Mike',
        partido: getMyParty()?.sigla,
        hace: 'recién',
        texto,
        likes: 0
      });
      showToast('Mensaje publicado en el canal (demo)');
      render();
    });
  }

  const btnMarkAllNotif = document.getElementById('btnMarkAllNotif');
  if (btnMarkAllNotif) {
    btnMarkAllNotif.addEventListener('click', () => {
      NOTIFICACIONES.forEach((n) => {
        n.leida = true;
      });
      showToast('Todas las notificaciones marcadas como leídas');
      render();
    });
  }

  $root.querySelectorAll<HTMLButtonElement>('[data-notif-id]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.notifId);
      const n = NOTIFICACIONES.find((x) => x.id === id);
      if (!n) return;
      n.leida = true;
      if (n.link.startsWith('ini:')) {
        jumpToInitiative(Number(n.link.slice(4)));
      } else if (n.link.startsWith('foro:')) {
        state.section = 'foro';
        state.activeChannel = n.link.slice(5);
        render();
      } else if (n.link.startsWith('party:')) {
        render();
        openPartyModal(n.link.slice(6));
      } else if (n.link === 'perfil') {
        render();
        openModal();
      } else {
        render();
      }
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-dm-thread]').forEach((b) => {
    b.onclick = () => {
      const id = Number(b.dataset.dmThread);
      const chat = CHATS_MD.find((c) => c.id === id);
      if (!chat) return;
      state.activeChatId = id;
      chat.noLeidos = 0;
      render();
    };
  });

  $root.querySelectorAll<HTMLButtonElement>('[data-new-dm]').forEach((b) => {
    b.onclick = () => {
      const alias = b.dataset.newDm;
      if (!alias) return;
      const cand = CANDIDATOS.find((c) => c.alias === alias);
      const existing = CHATS_MD.find((c) => c.alias === alias);
      if (existing) {
        state.activeChatId = existing.id;
      } else {
        const newChat: ChatMD = {
          id: CHATS_MD.length + 1,
          alias,
          partido: cand?.partido || undefined,
          noLeidos: 0,
          mensajes: []
        };
        CHATS_MD.unshift(newChat);
        state.activeChatId = newChat.id;
      }
      render();
      const dmInput = document.getElementById('dmInput') as HTMLInputElement | null;
      if (dmInput) dmInput.focus();
    };
  });

  const dmForm = document.getElementById('dmForm') as HTMLFormElement | null;
  if (dmForm) {
    dmForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('dmInput') as HTMLInputElement;
      const texto = input.value.trim();
      if (!texto) return;
      const chat = CHATS_MD.find((c) => c.id === state.activeChatId);
      if (!chat) return;
      chat.noLeidos = 0;
      chat.mensajes.push({ mio: true, texto, hace: 'ahora' });
      render();
      const bubbles = document.getElementById('dmBubbles');
      if (bubbles) bubbles.scrollTop = bubbles.scrollHeight;
    });
  }

  const partyChatForm = document.getElementById('partyChatForm') as HTMLFormElement | null;
  if (partyChatForm) {
    partyChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const myParty = getMyParty();
      if (!myParty) return;
      const input = document.getElementById('partyChatInput') as HTMLTextAreaElement;
      const texto = input.value.trim();
      if (texto.length < 2) {
        showToast('Escribe al menos 2 caracteres');
        return;
      }
      if (!CHATS_PARTIDO[myParty.sigla]) CHATS_PARTIDO[myParty.sigla] = [];
      CHATS_PARTIDO[myParty.sigla].unshift({
        id: state.nextPartyMsgId++,
        alias: 'Mike',
        hace: 'recién',
        texto
      });
      showToast(`Mensaje enviado a ${myParty.sigla} (demo)`);
      render();
    });
  }

  const btnGoPartidos = document.getElementById('btnGoPartidos');
  if (btnGoPartidos) {
    btnGoPartidos.addEventListener('click', () => {
      state.section = 'politica';
      state.subtab = 'partidos';
      render();
    });
  }

  const btnMasProfile = document.getElementById('btnMasProfile');
  if (btnMasProfile) {
    btnMasProfile.addEventListener('click', openModal);
  }
}

function openModal(): void {
  lastFocusedBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  $modal.hidden = false;
  const closeBtn = document.getElementById('btnCloseModal') as HTMLButtonElement | null;
  if (closeBtn) closeBtn.focus();
}

function closeModal(): void {
  $modal.hidden = true;
  if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
}

$btnModeProp.onclick = () => {
  if (state.mode === 'propuesta') return;
  state.mode = 'propuesta';
  render();
};

$btnModeLegacy.onclick = () => {
  if (state.mode === 'legacy') return;
  state.mode = 'legacy';
  render();
};

const btnBrandHome = document.getElementById('btnBrandHome');
if (btnBrandHome) {
  btnBrandHome.onclick = () => {
    state.section = 'politica';
    state.subtab = 'iniciativas';
    render();
  };
}

document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((b) => {
  b.onclick = () => {
    const target = (b.dataset.nav as MainSection) || 'politica';
    state.section = target;
    state.highlightIniId = null;
    if (target === 'mensajes') {
      const activeChat = CHATS_MD.find((c) => c.id === state.activeChatId);
      if (activeChat) activeChat.noLeidos = 0;
    }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const partyTrigger = target.closest<HTMLElement>('[data-open-party]');
  if (partyTrigger && partyTrigger.dataset.openParty) {
    if (!$modal.hidden) $modal.hidden = true;
    openPartyModal(partyTrigger.dataset.openParty);
  }
});

document.getElementById('btnProfile')?.addEventListener('click', openModal);
document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
$modal.addEventListener('click', (e) => {
  if (e.target === $modal) closeModal();
});
$partyModal.addEventListener('click', (e) => {
  if (e.target === $partyModal) closePartyModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$partyModal.hidden) closePartyModal();
    else if (!$modal.hidden) closeModal();
  }
});

render();
