/**
 * Cliente HTTP y Servicio de Integración Oficial para la API de Mercado Público (ChileCompra).
 * Proporciona consultas en vivo de licitaciones activas a nivel nacional,
 * normalización al esquema LicitacionData, caché en memoria y diagnóstico estructurado.
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

// Caché en memoria para optimizar rendimiento y cuotas de consulta
interface CacheEntry<T> {
  data: T;
  totalCantidad?: number;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
let liveTendersCache: CacheEntry<LicitacionData[]> | null = null;
const detailCache = new Map<string, CacheEntry<LicitacionData>>();

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
 * Consulta en vivo todas las licitaciones actualmente activas en Mercado Público (a nivel nacional).
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

    const tenders: LicitacionData[] = rawList.map((item: any) => ({
      codigo_externo: item.CodigoExterno,
      nombre: item.Nombre || 'Licitación Pública',
      codigo_estado: item.CodigoEstado || 5,
      descripcion: item.Descripcion || item.Nombre || '',
      fecha_cierre: item.FechaCierre || '',
      monto_estimado: typeof item.MontoEstimado === 'number' ? item.MontoEstimado : 0,
      moneda: item.Moneda || 'CLP',
      categoria_label: 'Mercado Público (En Vivo)',
      url_ficha: `https://www.mercadopublico.cl/fichaLicitacion.html?enc=${item.CodigoExterno}`,
      comprador: {
        nombre_organismo: item.Comprador?.NombreOrganismo || 'Organismo de Compras Públicas',
        region: item.Comprador?.RegionUnidad || 'Chile',
        comuna: item.Comprador?.ComunaUnidad || ''
      }
    }));

    return { tenders, totalCantidad: json.Cantidad || tenders.length };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con ChileCompra';
    return { tenders: [], error: msg };
  }
}

/**
 * Consulta en vivo las licitaciones por fecha específica (DDMMYYYY).
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
    const activeRaw = rawList.filter((item: any) => item.CodigoEstado === 5 || item.CodigoEstado === 6);

    const tenders: LicitacionData[] = activeRaw.map((item: any) => ({
      codigo_externo: item.CodigoExterno,
      nombre: item.Nombre || 'Licitación Pública',
      codigo_estado: item.CodigoEstado || 5,
      descripcion: item.Descripcion || item.Nombre || '',
      fecha_cierre: item.FechaCierre || '',
      monto_estimado: typeof item.MontoEstimado === 'number' ? item.MontoEstimado : 0,
      moneda: item.Moneda || 'CLP',
      categoria_label: 'Mercado Público (En Vivo)',
      url_ficha: `https://www.mercadopublico.cl/fichaLicitacion.html?enc=${item.CodigoExterno}`,
      comprador: {
        nombre_organismo: item.Comprador?.NombreOrganismo || 'Organismo de Compras Públicas',
        region: item.Comprador?.RegionUnidad || 'Chile',
        comuna: item.Comprador?.ComunaUnidad || ''
      }
    }));

    return { tenders, totalCantidad: json.Cantidad || tenders.length };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con ChileCompra';
    return { tenders: [], error: msg };
  }
}

/**
 * Consulta en vivo las licitaciones activas utilizando el ticket oficial.
 * Intenta primero con estado=activas (universo nacional) y como respaldo por fecha.
 */
export async function getLiveActiveTenders(
  ticket: string,
  forceRefresh = false
): Promise<{ tenders: LicitacionData[]; totalCantidad?: number; source: 'live' | 'cache' | 'error'; error?: string; ticketInvalido?: boolean }> {
  const now = Date.now();

  if (!forceRefresh && liveTendersCache && now - liveTendersCache.timestamp < CACHE_TTL_MS) {
    return { tenders: liveTendersCache.data, totalCantidad: liveTendersCache.totalCantidad, source: 'cache' };
  }

  // 1. Intentar consulta global de activas
  const activeRes = await fetchLiveActiveTenders(ticket);
  if (activeRes.ticketInvalido) {
    return { tenders: [], source: 'error', error: activeRes.error, ticketInvalido: true };
  }

  if (activeRes.tenders.length > 0) {
    liveTendersCache = { data: activeRes.tenders, totalCantidad: activeRes.totalCantidad, timestamp: now };
    return { tenders: activeRes.tenders, totalCantidad: activeRes.totalCantidad, source: 'live' };
  }

  // 2. Respaldo por fecha diaria si el endpoint de estado no respondió
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
      fecha_cierre: it.Fechas?.FechaCierre || it.FechaCierre || '',
      monto_estimado: typeof it.MontoEstimado === 'number' ? it.MontoEstimado : 0,
      moneda: it.Moneda || 'CLP',
      categoria_label: it.Items?.Listado?.[0]?.Categoria || 'Tecnologías de la Información',
      url_ficha: `https://www.mercadopublico.cl/fichaLicitacion.html?enc=${it.CodigoExterno}`,
      comprador: {
        codigo_organismo: it.Comprador?.CodigoOrganismo || '',
        nombre_organismo: it.Comprador?.NombreOrganismo || '',
        rut_unidad: it.Comprador?.RutUnidad || '',
        comuna: it.Comprador?.ComunaUnidad || '',
        region: it.Comprador?.RegionUnidad || ''
      },
      items: Array.isArray(it.Items?.Listado)
        ? it.Items.Listado.map((prod: any, idx: number) => ({
            correlativo: idx + 1,
            codigo_producto: prod.CodigoProducto,
            nombre_producto: prod.NombreProducto,
            categoria: prod.Categoria,
            descripcion: prod.Descripcion,
            cantidad: prod.Cantidad,
            unidad_medida: prod.UnidadMedida
          }))
        : []
    };

    detailCache.set(cleanCodigo, { data: licitacion, timestamp: now });
    return licitacion;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
