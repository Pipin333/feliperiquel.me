"""Cliente para la API de Mercado Público (ChileCompra)."""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
import httpx
from app.config import settings
from app.models import Licitacion, Comprador, ItemLicitacion
from app.mock_data import SAMPLE_LICITACIONES

logger = logging.getLogger("licitaciones.client")


class MercadoPublicoClient:
    """Cliente para interactuar con los servicios REST de ChileCompra."""

    def __init__(
        self,
        ticket: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        use_mock: Optional[bool] = None,
    ):
        self.ticket = ticket or settings.mp_ticket
        self.base_url = (base_url or settings.mp_base_url).rstrip("/")
        self.timeout = timeout or settings.mp_timeout_seconds
        self.use_mock = use_mock if use_mock is not None else settings.mp_use_mock

    def _is_mock_required(self) -> bool:
        """Determina si debemos operar con datos simulados."""
        if self.use_mock:
            return True
        if not self.ticket or self.ticket.strip() in ("", "TU_TICKET_AQUI", "TEST_TICKET"):
            return True
        return False

    async def get_licitaciones_activas(self) -> List[Licitacion]:
        """Obtiene las licitaciones actualmente publicadas/activas en Mercado Público.
        
        Consulta la API de ChileCompra por fecha diaria (DDMMYYYY). Si no se cuenta con ticket válido
        o la API no está disponible, utiliza datos de respaldo realistas.
        """
        if self._is_mock_required():
            logger.info("Usando catálogo de licitaciones de prueba (modo mock o ticket no configurado).")
            return list(SAMPLE_LICITACIONES)

        url = f"{self.base_url}/licitaciones.json"

        # Formato oficial exigido por Mercado Público: DDMMYYYY
        today = datetime.now()
        dates_to_try = [
            today.strftime("%d%m%Y"),
            (today - timedelta(days=1)).strftime("%d%m%Y")
        ]

        try:
            # Desactivamos verificación estricta de SSL para compatibilidad con la cadena de ChileCompra en Windows
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                for date_str in dates_to_try:
                    params = {
                        "fecha": date_str,
                        "ticket": self.ticket,
                    }
                    logger.info(f"Consultando API Mercado Público: {url}?fecha={date_str}")
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()

                    # Validar si el ticket es inválido
                    if isinstance(data, dict) and data.get("Codigo") == 203:
                        logger.error(
                            f"Ticket inválido en Mercado Público: {data.get('Mensaje')}. Usando fallback."
                        )
                        return list(SAMPLE_LICITACIONES)

                    raw_list = data.get("Listado", []) if isinstance(data, dict) else []
                    if not raw_list:
                        continue

                    # Filtrar sólo licitaciones activas/publicadas (CodigoEstado 5 = Publicada, 6 = Cierra hoy)
                    active_items = [
                        it for it in raw_list
                        if it.get("CodigoEstado") in (5, 6)
                    ]

                    licitaciones = [self._parse_raw_licitacion(item) for item in active_items]
                    if licitaciones:
                        logger.info(f"Se obtuvieron {len(licitaciones)} licitaciones activas en vivo de Mercado Público.")
                        return licitaciones

                logger.warning("No se encontraron licitaciones activas en las fechas consultadas. Usando catálogo base.")
                return list(SAMPLE_LICITACIONES)

        except Exception as e:
            logger.error(f"Error conectando a API Mercado Público: {e}. Usando datos de respaldo.")
            return list(SAMPLE_LICITACIONES)

    async def get_licitacion_por_codigo(self, codigo: str) -> Optional[Licitacion]:
        """Obtiene el detalle de una licitación específica por su Código Externo."""
        if self._is_mock_required():
            for lic in SAMPLE_LICITACIONES:
                if lic.codigo_externo.lower() == codigo.lower():
                    return lic
            return None

        url = f"{self.base_url}/licitaciones.json"
        params = {"codigo": codigo, "ticket": self.ticket}

        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                raw_list = data.get("Listado", [])
                if raw_list:
                    return self._parse_raw_licitacion(raw_list[0])
                return None
        except Exception as e:
            logger.error(f"Error al consultar licitación {codigo}: {e}")
            return None

    def _parse_raw_licitacion(self, item: dict) -> Licitacion:
        """Normaliza el diccionario recibido de la API de Mercado Público a modelo Licitacion."""
        comprador_data = item.get("Comprador", {})
        comprador = None
        if comprador_data:
            comprador = Comprador(
                codigo_organismo=comprador_data.get("CodigoOrganismo"),
                nombre_organismo=comprador_data.get("NombreOrganismo"),
                rut_unidad=comprador_data.get("RutUnidad"),
                direccion=comprador_data.get("DireccionUnidad"),
                comuna=comprador_data.get("ComunaUnidad"),
                region=comprador_data.get("RegionUnidad"),
            )

        items_list = []
        raw_items = item.get("Items", {})
        item_entries = raw_items.get("Listado", []) if isinstance(raw_items, dict) else []

        for it in item_entries:
            items_list.append(
                ItemLicitacion(
                    correlativo=it.get("Correlativo"),
                    codigo_producto=it.get("CodigoProducto"),
                    nombre_producto=it.get("NombreProducto"),
                    descripcion=it.get("Descripcion"),
                    categoria=it.get("Categoria"),
                    cantidad=float(it.get("Cantidad", 0)) if it.get("Cantidad") is not None else None,
                    unidad_medida=it.get("UnidadMedida"),
                )
            )

        monto = item.get("MontoEstimado")
        try:
            monto_float = float(monto) if monto is not None else None
        except (ValueError, TypeError):
            monto_float = None

        fechas = item.get("Fechas", {})
        fecha_cierre = fechas.get("FechaCierre") if isinstance(fechas, dict) else item.get("FechaCierre")

        return Licitacion(
            codigo_externo=item.get("CodigoExterno", "N/A"),
            nombre=item.get("Nombre", "Sin título"),
            codigo_estado=item.get("CodigoEstado"),
            descripcion=item.get("Descripcion") or item.get("Nombre", ""),
            fecha_cierre=fecha_cierre,
            monto_estimado=monto_float,
            moneda=item.get("Moneda", "CLP"),
            comprador=comprador,
            items=items_list,
        )
