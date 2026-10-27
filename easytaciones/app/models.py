from typing import List, Optional
from pydantic import BaseModel, Field


class ItemLicitacion(BaseModel):
    correlativo: Optional[int] = None
    codigo_producto: Optional[int] = None
    nombre_producto: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    cantidad: Optional[float] = None
    unidad_medida: Optional[str] = None


class Comprador(BaseModel):
    codigo_organismo: Optional[str] = None
    nombre_organismo: Optional[str] = None
    rut_unidad: Optional[str] = None
    direccion: Optional[str] = None
    comuna: Optional[str] = None
    region: Optional[str] = None


class Licitacion(BaseModel):
    codigo_externo: str = Field(..., description="Código oficial de la licitación (ej: 1022-12-LE24)")
    nombre: str = Field(..., description="Nombre o título de la licitación")
    codigo_estado: Optional[int] = Field(None, description="Estado (5 = Publicada / Activa)")
    descripcion: Optional[str] = Field(None, description="Descripción detallada de la licitación")
    fecha_cierre: Optional[str] = Field(None, description="Fecha y hora de cierre de recepción de ofertas")
    monto_estimado: Optional[float] = Field(None, description="Presupuesto o monto estimado si es público")
    moneda: Optional[str] = Field("CLP", description="Moneda (CLP, UF, USD)")
    comprador: Optional[Comprador] = None
    items: List[ItemLicitacion] = Field(default_factory=list)

    def get_searchable_text(self) -> str:
        """Genera un texto consolidado y enriquecido para generar el embedding semántico."""
        parts = [
            f"Título: {self.nombre}",
            f"Descripción: {self.descripcion or 'Sin descripción'}",
        ]
        if self.comprador and self.comprador.nombre_organismo:
            parts.append(f"Organismo Comprador: {self.comprador.nombre_organismo}")

        if self.items:
            items_desc = []
            for item in self.items:
                item_txt = f"{item.nombre_producto or ''} ({item.categoria or ''}): {item.descripcion or ''}".strip()
                if item_txt:
                    items_desc.append(item_txt)
            if items_desc:
                parts.append("Ítems y requerimientos: " + " | ".join(items_desc))

        return "\n".join(parts)


class MatchResult(BaseModel):
    licitacion: Licitacion
    score_percentage: float = Field(..., description="Porcentaje de similitud semántica (0.0 a 100.0%)")
    cosine_similarity: float = Field(..., description="Similitud coseno cruda (-1.0 a 1.0)")
    ranking: int = Field(..., description="Posición en el ranking de coincidencias")


class MatchSearchRequest(BaseModel):
    query: str = Field(
        ...,
        description="Perfil de búsqueda, descripción de servicios, o palabras de interés (ej: 'servicios de ciberseguridad y pentesting para plataformas web')",
        min_length=3,
    )
    min_score_percentage: float = Field(
        default=50.0,
        ge=0.0,
        le=100.0,
        description="Porcentaje mínimo de similitud requerido para incluir en resultados (0-100%)",
    )
    top_k: Optional[int] = Field(
        default=20,
        ge=1,
        le=200,
        description="Cantidad máxima de licitaciones a retornar",
    )
    force_refresh: bool = Field(
        default=False,
        description="Forzar descarga y nuevo cálculo omitiendo cache",
    )


class DirectMatchRequest(BaseModel):
    query: str = Field(..., description="Perfil o requerimiento de búsqueda")
    min_score_percentage: float = Field(default=50.0, ge=0.0, le=100.0)
    licitaciones: List[Licitacion] = Field(..., description="Lista de licitaciones a evaluar")


class MatchSearchResponse(BaseModel):
    query: str
    total_evaluadas: int
    total_coincidentes: int
    min_score_aplicado: float
    tiempo_procesamiento_ms: float
    resultados: List[MatchResult]
