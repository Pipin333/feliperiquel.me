"""Módulo de configuración centralizada de MicroToodles.

Carga y valida variables de entorno mediante pydantic-settings, asegurando
valores por defecto seguros para desarrollo local y contenedores de producción.
"""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración inmutable del servicio MicroToodles.

    Define las credenciales de Spotify Web API, puertos de red, parámetros
    de conexión a base de datos y directivas de seguridad CORS.
    """

    SPOTIFY_CLIENT_ID: str = Field(
        default="",
        description="Client ID de la aplicación en Spotify Developer Dashboard.",
    )
    SPOTIFY_CLIENT_SECRET: str = Field(
        default="",
        description="Client Secret de la aplicación en Spotify Developer Dashboard.",
    )
    SPOTIFY_PLAYLIST_ID: str = Field(
        default="",
        description="Identificador público o URI de la playlist curada de Spotify.",
    )
    PORT: int = Field(
        default=8080,
        description="Puerto TCP en el cual escucha el servidor FastAPI.",
    )
    HOST: str = Field(
        default="0.0.0.0",
        description="Interfaz de red para vincular el servidor Uvicorn.",
    )
    CORS_ORIGIN: str = Field(
        default="https://feliperiquel.me",
        description="Origen permitido para solicitudes CORS desde el frontend.",
    )
    DATABASE_PATH: str = Field(
        default="toodles_stream.db",
        description="Ruta del archivo SQLite local para almacenamiento en modo WAL.",
    )
    MEDIA_DIR: str = Field(
        default="/app/data/media",
        description="Directorio donde se almacenan las pistas locales de audio MP3.",
    )
    ADMIN_TOKEN: str = Field(
        default="microtoodles_secret_token",
        description="Token de autenticación Bearer para endpoints protegidos.",
    )
    SYNC_INTERVAL_HOURS: int = Field(
        default=6,
        description="Intervalo en horas para sincronizar la playlist con Spotify API.",
    )
    FFMPEG_BIN: str = Field(
        default="ffmpeg",
        description="Ruta o nombre del ejecutable de FFmpeg en el sistema.",
    )
    PROXY_LIST: str = Field(
        default="",
        description="Lista separada por comas de proxies (SOCKS5/HTTP) para eludir bloqueos de datacenter.",
    )
    ENV: str = Field(
        default="development",
        description="Entorno de ejecución (development, staging, production).",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Devuelve la instancia singleton cacheada de la configuración del sistema.

    Returns:
        Settings: Objeto con todas las variables de configuración validadas.
    """
    return Settings()
