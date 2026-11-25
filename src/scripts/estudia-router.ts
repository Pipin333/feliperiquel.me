export type EstudiaTabId = 'tab-home' | 'tab-aed' | 'tab-ada' | 'tab-ia';

export type EstudiaCourseTabId = Exclude<EstudiaTabId, 'tab-home'>;

export interface EstudiaRoute {
  readonly tabId: EstudiaTabId;
  readonly subId: string | null;
  readonly hash: string;
  readonly title: string;
}

export const ESTUDIA_DEFAULT_TITLE = 'estudIA | Hub de Estudio AED, ADA e IA';

/**
 * Non-empty hash `#inicio` ensures forward navigation back to Mapa de Ramos
 * uses Astro ClientRouter's intra-page hash fast-path (`direction !== 'back' && to.hash`)
 * instead of fetching HTML and swapping the DOM.
 */
export const ESTUDIA_HOME_ROUTE: EstudiaRoute = {
  tabId: 'tab-home',
  subId: null,
  hash: '#inicio',
  title: ESTUDIA_DEFAULT_TITLE
};

type SectionKey = 'syllabus' | 'torpedo' | 'tools' | 'guide' | 'quiz';
type CoursePrefix = 'aed' | 'ada' | 'ia';

const COURSE_ROUTES: Record<EstudiaCourseTabId, readonly EstudiaRoute[]> = {
  'tab-aed': [
    {
      tabId: 'tab-aed',
      subId: 'aed-syllabus',
      hash: '#aed/syllabus',
      title: 'AED · Ficha y Syllabus | estudIA'
    },
    {
      tabId: 'tab-aed',
      subId: 'aed-torpedo',
      hash: '#aed/torpedo',
      title: 'AED · Torpedo | estudIA'
    },
    {
      tabId: 'tab-aed',
      subId: 'aed-tools',
      hash: '#aed/simuladores',
      title: 'AED · Simuladores | estudIA'
    },
    {
      tabId: 'tab-aed',
      subId: 'aed-guide',
      hash: '#aed/guia',
      title: 'AED · Teoría y Solemnes | estudIA'
    },
    {
      tabId: 'tab-aed',
      subId: 'aed-quiz',
      hash: '#aed/quiz',
      title: 'AED · Cuestionario | estudIA'
    }
  ],
  'tab-ada': [
    {
      tabId: 'tab-ada',
      subId: 'ada-syllabus',
      hash: '#ada/syllabus',
      title: 'ADA · Ficha y Syllabus | estudIA'
    },
    {
      tabId: 'tab-ada',
      subId: 'ada-torpedo',
      hash: '#ada/torpedo',
      title: 'ADA · Torpedo | estudIA'
    },
    {
      tabId: 'tab-ada',
      subId: 'ada-tools',
      hash: '#ada/simuladores',
      title: 'ADA · Simuladores | estudIA'
    },
    {
      tabId: 'tab-ada',
      subId: 'ada-guide',
      hash: '#ada/guia',
      title: 'ADA · Guía Explicativa | estudIA'
    },
    {
      tabId: 'tab-ada',
      subId: 'ada-quiz',
      hash: '#ada/quiz',
      title: 'ADA · Cuestionario | estudIA'
    }
  ],
  'tab-ia': [
    {
      tabId: 'tab-ia',
      subId: 'ia-syllabus',
      hash: '#ia/syllabus',
      title: 'IA · Ficha y Syllabus | estudIA'
    },
    {
      tabId: 'tab-ia',
      subId: 'ia-torpedo',
      hash: '#ia/torpedo',
      title: 'IA · Torpedo | estudIA'
    },
    {
      tabId: 'tab-ia',
      subId: 'ia-tools',
      hash: '#ia/calculadoras',
      title: 'IA · Calculadoras | estudIA'
    },
    {
      tabId: 'tab-ia',
      subId: 'ia-guide',
      hash: '#ia/guia',
      title: 'IA · Teoría y Solemnes | estudIA'
    },
    {
      tabId: 'tab-ia',
      subId: 'ia-quiz',
      hash: '#ia/quiz',
      title: 'IA · Cuestionario | estudIA'
    }
  ]
};

const DEFAULT_COURSE_SUB_ID: Record<EstudiaCourseTabId, string> = {
  'tab-aed': 'aed-torpedo',
  'tab-ada': 'ada-torpedo',
  'tab-ia': 'ia-torpedo'
};

const COURSE_PREFIX_MAP: Record<string, { prefix: CoursePrefix; tabId: EstudiaCourseTabId }> = {
  aed: { prefix: 'aed', tabId: 'tab-aed' },
  ada: { prefix: 'ada', tabId: 'tab-ada' },
  ia: { prefix: 'ia', tabId: 'tab-ia' }
};

const SECTION_ALIAS_MAP: Record<string, SectionKey> = {
  syllabus: 'syllabus',
  ficha: 'syllabus',
  torpedo: 'torpedo',
  simuladores: 'tools',
  calculadoras: 'tools',
  tools: 'tools',
  guia: 'guide',
  guide: 'guide',
  teoria: 'guide',
  quiz: 'quiz',
  cuestionario: 'quiz'
};

function isCourseTabId(tabId: string): tabId is EstudiaCourseTabId {
  return tabId === 'tab-aed' || tabId === 'tab-ada' || tabId === 'tab-ia';
}

/** Resolves a canonical estudIA route for a given tab and optional sub-panel ID. */
export function routeForView(tabId: string, subId?: string | null): EstudiaRoute {
  if (!isCourseTabId(tabId)) {
    return ESTUDIA_HOME_ROUTE;
  }

  const routes = COURSE_ROUTES[tabId];
  const targetSubId = subId ?? DEFAULT_COURSE_SUB_ID[tabId];
  const matched = routes.find((route) => route.subId === targetSubId);
  if (matched) return matched;

  const fallbackSubId = DEFAULT_COURSE_SUB_ID[tabId];
  return routes.find((route) => route.subId === fallbackSubId) ?? ESTUDIA_HOME_ROUTE;
}

/** Parses and normalizes a URL hash fragment into a valid estudIA route. */
export function resolveEstudiaHash(rawHash: string): EstudiaRoute {
  const normalized = rawHash
    .trim()
    .replace(/^#+/, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!normalized || normalized === 'inicio' || normalized === 'home' || normalized === 'tab-home') {
    return ESTUDIA_HOME_ROUTE;
  }

  const cleaned = normalized.startsWith('tab-') ? normalized.slice(4) : normalized;
  const parts = cleaned.split(/[/-]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) {
    return ESTUDIA_HOME_ROUTE;
  }

  const courseInfo = COURSE_PREFIX_MAP[parts[0]];
  if (!courseInfo) {
    return ESTUDIA_HOME_ROUTE;
  }

  if (parts.length === 1) {
    return routeForView(courseInfo.tabId, null);
  }

  const sectionKey = SECTION_ALIAS_MAP[parts[1]];
  if (!sectionKey) {
    return ESTUDIA_HOME_ROUTE;
  }

  return routeForView(courseInfo.tabId, `${courseInfo.prefix}-${sectionKey}`);
}

/** Compares whether two estudIA routes point to the exact same tab and sub-panel. */
export function isSameEstudiaRoute(a: EstudiaRoute, b: EstudiaRoute): boolean {
  return a.tabId === b.tabId && a.subId === b.subId;
}
