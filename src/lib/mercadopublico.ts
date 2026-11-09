/**
 * Cliente HTTP y Servicio de Integración Oficial para la API de Mercado Público (ChileCompra).
 * Proporciona consultas en vivo de licitaciones activas a nivel nacional,
 * filtrado estricto de licitaciones cerradas/vencidas, normalización al esquema LicitacionData,
 * caché en memoria y diagnóstico estructurado.
 */

import type { LicitacionData } from '../pages/api/easytaciones/match';

interface MercadoPublicoResponse {
  Cantidad?: number;
  FechaCreacion?: string;
  Version?: string;
  Codigo?: number;
  Mensaje?: string;
  Listado?: any[];
}

interface CacheEntry<T> {
  data: T;
  totalCantidad?: number;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
let liveTendersCache: CacheEntry<LicitacionData[]> | null = null;
const detailCache = new Map<string, CacheEntry<LicitacionData>>();

/**
 * Verifica que una licitación esté estrictamente abierta/publicada (estado 5)
 * y que su fecha de cierre sea posterior al instante actual.
 */
export function isTenderOpen(
  fechaCierre?: string | null,
  codigoEstado: number = 5,
  nowMs: number = Date.now()
): boolean {
  // En Mercado Público: 5 = Publicada (Abierta). 6 = Cerrada, 7 = Desierta, 8 = Adjudicada, 15/18 = Revocada/Suspendida
  if (codigoEstado !== undefined && codigoEstado !== null && Number(codigoEstado) !== 5) {
    return false;
  }

  if (fechaCierre && typeof fechaCierre === 'string' && fechaCierre.trim().length > 0) {
    const parsedMs = new Date(fechaCierre.trim()).getTime();
    if (!Number.isNaN(parsedMs) && parsedMs <= nowMs) {
      return false;
    }
  }

  return true;
}

/**
 * Clasifica si una licitación pertenece al rubro TI y asigna su categoría.
 */
export function classifyItTender(text: string): { isIt: boolean; categoria_id: string; categoria_label: string; base_score: number } {
  const t = (text || '').toLowerCase();
  const itRegex = /\b(software|sistema\s+web|plataforma|base\s+de\s+datos|bases\s+de\s+datos|business\s+intelligence|power\s+bi|desarrollo\s+de\s+sistema|desarrollo\s+web|aplicaci[oó]n|migraci[oó]n\s+de\s+datos|nube|cloud|aws|azure|ciberseguridad|inform[aá]tic[oa]|licencias\s+de\s+software|licencias\s+microsoft|soporte\s+ti|mantenci[oó]n\s+de\s+sistema|erp|crm|interoperabilidad|servidor|hosting|datacenter|data\s+warehouse|bodega\s+de\s+datos|anal[ií]tica|portal\s+web|intranet|firewall|computaci[oó]n)\b/i;
  const excludeRegex = /\b(m[eé]dic[oa]|quir[uú]rgic|dental|farmac|ambulancia|veh[ií]culo|camioneta|construcci[oó]n|paviment|aseo|alimentaci[oó]n|guardias|vigilancia|mobiliario|aire\s+acondicionado|calefacci[oó]n|el[eé]ctric|pintura|jardines|evento|catering|transporte\s+escolar|ascensor)\b/i;

  if (!itRegex.test(t) || excludeRegex.test(t)) {
    return { isIt: false, categoria_id: 'otros', categoria_label: 'General', base_score: 40 };
  }

  if (/base de datos|bases de datos|ods|bodega de datos|data warehouse|etl|power bi|business intelligence|microstrategy|anal[ií]tica|sql|oracle/.test(t)) {
    return { isIt: true, categoria_id: 'datos', categoria_label: 'Datos, BD, ODS & BI', base_score: 82.5 };
  }
  if (/desarrollo|software|plataforma|sistema web|aplicaci[oó]n|portal web|erp|crm|intranet|api/.test(t)) {
    return { isIt: true, categoria_id: 'software', categoria_label: 'Software, Plataformas & ERP', base_score: 80.0 };
  }
  if (/cloud|nube|aws|azure|hosting|datacenter|virtualizaci[oó]n|iaas|saas/.test(t)) {
    return { isIt: true, categoria_id: 'cloud', categoria_label: 'Cloud, IaaS & Virtualización', base_score: 76.5 };
  }
  if (/ciberseguridad|seguridad de la informaci[oó]n|firewall|vulnerabilidad|iso 27001|pentest/.test(t)) {
    return { isIt: true, categoria_id: 'ciberseguridad', categoria_label: 'Ciberseguridad & Redes', base_score: 74.0 };
  }
  if (/consultor[ií]a|asesor[ií]a|diagn[oó]stico|transformaci[oó]n digital|levantamiento/.test(t)) {
    return { isIt: true, categoria_id: 'consultoria', categoria_label: 'Consultoría & Gestión TI', base_score: 75.0 };
  }
  if (/licencia|suscripci[oó]n|renovaci[oó]n/.test(t)) {
    return { isIt: true, categoria_id: 'licencias', categoria_label: 'Licencias & Suscripciones', base_score: 64.0 };
  }
  if (/computador|notebook|impresora|equipamiento|hardware|servidor f[ií]sico/.test(t)) {
    return { isIt: true, categoria_id: 'hardware', categoria_label: 'Servidores & Equipamiento TI', base_score: 52.0 };
  }

  return { isIt: true, categoria_id: 'software', categoria_label: 'Software, Plataformas & ERP', base_score: 72.0 };
}

/**
 * Formatea una fecha como DDMMYYYY para la API de Mercado Público.
 */
export function formatChileCompraDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Consulta en vivo todas las licitaciones actualmente activas en Mercado Público (a nivel nacional),
 * descartando aquellas cerradas o cuya fecha de cierre ya expiró.
 */
export async function fetchLiveActiveTenders(
  ticket: string
): Promise<{ tenders: LicitacionData[]; totalCantidad?: number; error?: string; ticketInvalido?: boolean }> {
  const cleanTicket = ticket.trim();
  if (!cleanTicket) {
    return { tenders: [], error: 'No se ha provisto un ticket de Mercado Público.' };
  }

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=${cleanTicket}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'feliperiquel.me-easytaciones/1.0'
      }
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { tenders: [], error: `Error HTTP ${res.status} desde Mercado Público.` };
    }

    const json = (await res.json().catch(() => ({}))) as MercadoPublicoResponse;

    if (json.Codigo === 203 || (json.Mensaje && json.Mensaje.toLowerCase().includes('ticket'))) {
      return {
        tenders: [],
        error: json.Mensaje || 'Ticket de Mercado Público no válido o expirado.',
        ticketInvalido: true
      };
    }

    const rawList = Array.isArray(json.Listado) ? json.Listado : [];
    const nowMs = Date.now();

    const tenders: LicitacionData[] = [];
    for (const item of rawList) {
      const estado = item.CodigoEstado ?? 5;
      const fechaCierre = item.FechaCierre || '';
      if (!isTenderOpen(fechaCierre, estado, nowMs)) continue;

      const nombre = item.Nombre || 'Licitación Pública';
      const desc = item.Descripcion || nombre;
      const cls = classifyItTender(`${nombre} ${desc}`);
      if (!cls.isIt) continue;

      tenders.push({
        codigo_externo: item.CodigoExterno,
        nombre,
        codigo_estado: 5,
        descripcion: desc,
        fecha_cierre: fechaCierre,
        monto_estimado: typeof item.MontoEstimado === 'number' ? item.MontoEstimado : 0,
        moneda: item.Moneda || 'CLP',
        categoria_id: cls.categoria_id,
        categoria_label: cls.categoria_label,
        score_percentage: cls.base_score,
        url_ficha: `https://www.mercadopublico.cl/FichaLicitacion.html?idLicitacion=${item.CodigoExterno}`,
        comprador: {
          nombre_organismo: item.Comprador?.NombreOrganismo || 'Organismo del Estado de Chile',
          region: item.Comprador?.RegionUnidad || 'Chile',
          comuna: item.Comprador?.ComunaUnidad || ''
        }
      });
    }

    return { tenders, totalCantidad: json.Cantidad || rawList.length };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con ChileCompra';
    return { tenders: [], error: msg };
  }
}

/**
 * Consulta en vivo las licitaciones por fecha específica (DDMMYYYY),
 * conservando exclusivamente aquellas con CodigoEstado === 5 (Publicada) y cierre futuro.
 */
export async function fetchLiveLicitacionesByDate(
  ticket: string,
  dateStr: string
): Promise<{ tenders: LicitacionData[]; totalCantidad?: number; error?: string; ticketInvalido?: boolean }> {
  const cleanTicket = ticket.trim();
  if (!cleanTicket) {
    return { tenders: [], error: 'No se ha provisto un ticket de Mercado Público.' };
  }

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${dateStr}&ticket=${cleanTicket}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'feliperiquel.me-easytaciones/1.0'
      }
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { tenders: [], error: `Error HTTP ${res.status} desde Mercado Público.` };
    }

    const json = (await res.json().catch(() => ({}))) as MercadoPublicoResponse;

    if (json.Codigo === 203 || (json.Mensaje && json.Mensaje.toLowerCase().includes('ticket'))) {
      return {
        tenders: [],
        error: json.Mensaje || 'Ticket de Mercado Público no válido o expirado.',
        ticketInvalido: true
      };
    }

    const rawList = Array.isArray(json.Listado) ? json.Listado : [];
    const nowMs = Date.now();
    const activeRaw = rawList.filter((item: any) => isTenderOpen(item.FechaCierre, item.CodigoEstado ?? 5, nowMs));

    const tenders: LicitacionData[] = [];
    for (const item of activeRaw) {
      const nombre = item.Nombre || 'Licitación Pública';
      const desc = item.Descripcion || nombre;
      const cls = classifyItTender(`${nombre} ${desc}`);
      if (!cls.isIt) continue;

      tenders.push({
        codigo_externo: item.CodigoExterno,
        nombre,
        codigo_estado: 5,
        descripcion: desc,
        fecha_cierre: item.FechaCierre || '',
        monto_estimado: typeof item.MontoEstimado === 'number' ? item.MontoEstimado : 0,
        moneda: item.Moneda || 'CLP',
        categoria_id: cls.categoria_id,
        categoria_label: cls.categoria_label,
        score_percentage: cls.base_score,
        url_ficha: `https://www.mercadopublico.cl/FichaLicitacion.html?idLicitacion=${item.CodigoExterno}`,
        comprador: {
          nombre_organismo: item.Comprador?.NombreOrganismo || 'Organismo del Estado de Chile',
          region: item.Comprador?.RegionUnidad || 'Chile',
          comuna: item.Comprador?.ComunaUnidad || ''
        }
      });
    }

    return { tenders, totalCantidad: json.Cantidad || rawList.length };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con ChileCompra';
    return { tenders: [], error: msg };
  }
}

/**
 * Consulta en vivo las licitaciones activas utilizando el ticket oficial.
 */
export async function getLiveActiveTenders(
  ticket: string,
  forceRefresh = false
): Promise<{ tenders: LicitacionData[]; totalCantidad?: number; source: 'live' | 'cache' | 'error'; error?: string; ticketInvalido?: boolean }> {
  const now = Date.now();

  if (!forceRefresh && liveTendersCache && now - liveTendersCache.timestamp < CACHE_TTL_MS) {
    const validCached = liveTendersCache.data.filter(t => isTenderOpen(t.fecha_cierre, t.codigo_estado, now));
    return { tenders: validCached, totalCantidad: liveTendersCache.totalCantidad, source: 'cache' };
  }

  const activeRes = await fetchLiveActiveTenders(ticket);
  if (activeRes.ticketInvalido) {
    return { tenders: [], source: 'error', error: activeRes.error, ticketInvalido: true };
  }

  if (activeRes.tenders.length > 0) {
    liveTendersCache = { data: activeRes.tenders, totalCantidad: activeRes.totalCantidad, timestamp: now };
    return { tenders: activeRes.tenders, totalCantidad: activeRes.totalCantidad, source: 'live' };
  }

  const today = new Date();
  const dateStr = formatChileCompraDate(today);
  const byDateRes = await fetchLiveLicitacionesByDate(ticket, dateStr);

  if (byDateRes.ticketInvalido) {
    return { tenders: [], source: 'error', error: byDateRes.error, ticketInvalido: true };
  }

  if (byDateRes.tenders.length > 0) {
    liveTendersCache = { data: byDateRes.tenders, totalCantidad: byDateRes.totalCantidad, timestamp: now };
    return { tenders: byDateRes.tenders, totalCantidad: byDateRes.totalCantidad, source: 'live' };
  }

  return { tenders: [], source: 'error', error: activeRes.error || byDateRes.error };
}

/**
 * Consulta el detalle exhaustivo de una licitación puntual por su Código Externo en Mercado Público.
 */
export async function fetchLiveTenderDetail(
  ticket: string,
  codigo: string
): Promise<LicitacionData | null> {
  const cleanCodigo = codigo.trim().toUpperCase();
  const now = Date.now();

  const cached = detailCache.get(cleanCodigo);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(cleanCodigo)}&ticket=${ticket.trim()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const json = (await res.json().catch(() => ({}))) as MercadoPublicoResponse;
    const rawList = Array.isArray(json.Listado) ? json.Listado : [];
    if (rawList.length === 0) return null;

    const it = rawList[0];
    const licitacion: LicitacionData = {
      codigo_externo: it.CodigoExterno,
      nombre: it.Nombre || 'Licitación Pública',
      codigo_estado: it.CodigoEstado || 5,
      descripcion: it.Descripcion || it.Nombre || '',
      fecha_cierre: it.FechaCierre?.FechaCierre || it.FechaCierre || '',
      monto_estimado: typeof it.MontoEstimado === 'number' ? it.MontoEstimado : 0,
      moneda: it.Moneda || 'CLP',
      categoria_label: 'Mercado Público (Detalle Oficial)',
      url_ficha: `https://www.mercadopublico.cl/FichaLicitacion.html?idLicitacion=${it.CodigoExterno}`,
      comprador: {
        codigo_organismo: it.Comprador?.CodigoOrganismo || '',
        nombre_organismo: it.Comprador?.NombreOrganismo || 'Organismo del Estado de Chile',
        rut_unidad: it.Comprador?.RutUnidad || '',
        comuna: it.Comprador?.ComunaUnidad || '',
        region: it.Comprador?.RegionUnidad || 'Chile'
      }
    };

    detailCache.set(cleanCodigo, { data: licitacion, timestamp: now });
    return licitacion;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
