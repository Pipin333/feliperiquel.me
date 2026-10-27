"""API FastAPI para búsqueda semántica de licitaciones de Mercado Público."""

import asyncio
import time
import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import (
    Licitacion,
    MatchResult,
    MatchSearchRequest,
    MatchSearchResponse,
    DirectMatchRequest,
)
from app.client_mp import MercadoPublicoClient
from app.matcher import LicitacionMatcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("licitaciones.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Eventos de inicialización y cierre de la API."""
    logger.info("Iniciando API Licitaciones Matcher...")
    # Pre-cargar el modelo de Transformers en background para respuesta rápida
    matcher = LicitacionMatcher.get_instance()
    _ = matcher.model
    logger.info("Servicio listo para recibir consultas.")
    yield
    logger.info("Cerrando API Licitaciones Matcher...")


app = FastAPI(
    title="Mercado Público Semantic Matcher API",
    description="Filtro inteligente de licitaciones activas de Mercado Público (Chile) basado en similitud semántica con Transformers.",
    version="1.0.0",
    lifespan=lifespan,
)

# Habilitar CORS para integración con cualquier frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Info"])
async def root():
    return {
        "sistema": "Mercado Público Semantic Matcher",
        "version": "1.0.0",
        "modelo_transformer": settings.transformer_model_name,
        "modo_mock": settings.mp_use_mock or not bool(settings.mp_ticket),
        "docs_url": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "timestamp": time.time()}


@app.get("/api/v1/licitaciones/activas", response_model=List[Licitacion], tags=["Licitaciones"])
async def get_licitaciones_activas():
    """Obtiene el listado completo de licitaciones activas/publicadas disponibles."""
    client = MercadoPublicoClient()
    licitaciones = await client.get_licitaciones_activas()
    return licitaciones


@app.get("/api/v1/licitaciones/{codigo}", response_model=Licitacion, tags=["Licitaciones"])
async def get_licitacion_detalle(codigo: str):
    """Obtiene el detalle de una licitación según su Código Externo."""
    client = MercadoPublicoClient()
    licitacion = await client.get_licitacion_por_codigo(codigo)
    if not licitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Licitación con código '{codigo}' no encontrada",
        )
    return licitacion


@app.post("/api/v1/licitaciones/match", response_model=MatchSearchResponse, tags=["Matching Semántico"])
async def match_licitaciones_activas(req: MatchSearchRequest):
    """Filtra y rankea licitaciones activas por similitud semántica contra un perfil o query.
    
    - **query**: Perfil de servicios o requerimientos a buscar.
    - **min_score_percentage**: Umbral mínimo porcentual (ej: 50.0 = sólo >= 50% de match).
    - **top_k**: Máximo de resultados a retornar.
    """
    t0 = time.time()
    client = MercadoPublicoClient()
    licitaciones = await client.get_licitaciones_activas()

    matcher = LicitacionMatcher.get_instance()
    # Ejecutamos el cómputo CPU-bound de embeddings en un thread separado para no bloquear el event loop
    matches = await asyncio.to_thread(
        matcher.match,
        query=req.query,
        licitaciones=licitaciones,
        min_score_percentage=req.min_score_percentage,
        top_k=req.top_k or 20,
        force_refresh=req.force_refresh,
    )

    t_elapsed_ms = round((time.time() - t0) * 1000.0, 2)

    return MatchSearchResponse(
        query=req.query,
        total_evaluadas=len(licitaciones),
        total_coincidentes=len(matches),
        min_score_aplicado=req.min_score_percentage,
        tiempo_procesamiento_ms=t_elapsed_ms,
        resultados=matches,
    )


@app.post("/api/v1/licitaciones/match-direct", response_model=MatchSearchResponse, tags=["Matching Semántico"])
async def match_direct(req: DirectMatchRequest):
    """Permite enviar una lista arbitraria de licitaciones para evaluar match semántico directo."""
    t0 = time.time()
    matcher = LicitacionMatcher.get_instance()
    matches = await asyncio.to_thread(
        matcher.match,
        query=req.query,
        licitaciones=req.licitaciones,
        min_score_percentage=req.min_score_percentage,
        top_k=len(req.licitaciones),
    )
    t_elapsed_ms = round((time.time() - t0) * 1000.0, 2)

    return MatchSearchResponse(
        query=req.query,
        total_evaluadas=len(req.licitaciones),
        total_coincidentes=len(matches),
        min_score_aplicado=req.min_score_percentage,
        tiempo_procesamiento_ms=t_elapsed_ms,
        resultados=matches,
    )

