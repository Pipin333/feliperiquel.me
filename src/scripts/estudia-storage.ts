export type CourseId = 'aed' | 'ada' | 'ia';

export interface StoredMistake {
  id: string;
  unit?: string;
  tag: string;
  q: string;
  opts: string[];
  ans: number;
  exp: string;
  failedAt: number;
}

export type MistakeStore = Record<CourseId, StoredMistake[]>;

export const MISTAKES_STORAGE_KEY = 'estudia_mistakes_v1';
const MAX_MISTAKES_PER_COURSE = 40;

function emptyStore(): MistakeStore {
  return { aed: [], ada: [], ia: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidStoredMistake(value: unknown): value is StoredMistake {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || !value.id) return false;
  if (typeof value.tag !== 'string' || typeof value.q !== 'string' || typeof value.exp !== 'string') {
    return false;
  }
  if (!Array.isArray(value.opts) || !value.opts.every((opt) => typeof opt === 'string')) {
    return false;
  }
  if (typeof value.ans !== 'number' || !Number.isInteger(value.ans) || value.ans < 0 || value.ans >= value.opts.length) {
    return false;
  }
  if (typeof value.failedAt !== 'number' || !Number.isFinite(value.failedAt)) {
    return false;
  }
  if (value.unit !== undefined && typeof value.unit !== 'string') {
    return false;
  }
  return true;
}

function sanitizeCourseList(raw: unknown): StoredMistake[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidStoredMistake).slice(0, MAX_MISTAKES_PER_COURSE);
}

function saveStore(store: MistakeStore): void {
  try {
    window.localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage may be unavailable in private browsing or quota-restricted environments.
  }
}

/** Loads persisted quiz mistakes grouped by course from localStorage. */
export function loadMistakes(): MistakeStore {
  try {
    const raw = window.localStorage.getItem(MISTAKES_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyStore();
    return {
      aed: sanitizeCourseList(parsed.aed),
      ada: sanitizeCourseList(parsed.ada),
      ia: sanitizeCourseList(parsed.ia)
    };
  } catch {
    return emptyStore();
  }
}

/** Saves or refreshes a missed quiz question for the given course (capped at 40 entries). */
export function recordMistake(course: CourseId, item: Omit<StoredMistake, 'failedAt'>): StoredMistake[] {
  const store = loadMistakes();
  const filtered = store[course].filter((entry) => entry.id !== item.id);
  const nextEntry: StoredMistake = {
    ...item,
    opts: [...item.opts],
    failedAt: Date.now()
  };
  store[course] = [nextEntry, ...filtered].slice(0, MAX_MISTAKES_PER_COURSE);
  saveStore(store);
  return store[course];
}

/** Removes a resolved question from the course's persisted mistake list. */
export function resolveMistake(course: CourseId, id: string): StoredMistake[] {
  const store = loadMistakes();
  store[course] = store[course].filter((entry) => entry.id !== id);
  saveStore(store);
  return store[course];
}

/** Clears all persisted quiz mistakes for the given course. */
export function clearMistakes(course: CourseId): void {
  const store = loadMistakes();
  store[course] = [];
  saveStore(store);
}
