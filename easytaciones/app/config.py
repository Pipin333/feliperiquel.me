import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración general de la aplicación."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API Mercado Público (ChileCompra)
    mp_ticket: str = ""
    mp_base_url: str = "https://api.mercadopublico.cl/servicios/v1/publico"
    mp_use_mock: bool = False  # Si está en True o si no hay ticket, usa datos simulados
    mp_timeout_seconds: float = 25.0

    # Modelo de Transformers para embeddings
    transformer_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    # "auto": detecta GPU CUDA automáticamente; o fuerza "cuda" / "cpu"
    device: str = "auto"
    # Habilitar precisión media FP16 para aceleración directa en Tensor Cores (RTX)
    use_fp16: bool = True
    batch_size_cuda: int = 128
    batch_size_cpu: int = 32

    # Parámetros de matching
    default_min_score: float = 50.0  # Porcentaje mínimo de match (0.0 a 100.0)
    top_k_default: int = 20

    # Cache de embeddings en memoria para evitar recomputar licitaciones
    cache_ttl_seconds: int = 1800


settings = Settings()
