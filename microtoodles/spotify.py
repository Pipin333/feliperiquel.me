"""Cliente asíncrono para interactuar con Spotify.

Implementa autenticación mediante Client Credentials Flow y un extractor de alta
resiliencia que recurre al embed público para evitar bloqueos por cambios de API.
"""

import json
import logging
import re
import time
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger("microtoodles.spotify")


class Track(BaseModel):
    """Representa una pista musical con sus metadatos normalizados."""

    id: str = Field(description="Identificador único de Spotify.")
    title: str = Field(description="Título de la canción.")
    artist: str = Field(description="Nombre del artista principal o colaboradores.")
    album: str = Field(default="", description="Nombre del álbum de lanzamiento.")
    cover_url: str = Field(default="", description="URL de la portada en alta resolución.")
    duration_ms: int = Field(default=0, description="Duración total en milisegundos.")


class SpotifyClient:
    """Gestiona la autenticación y extracción de pistas desde Spotify Web API."""

    TOKEN_URL = "https://accounts.spotify.com/api/token"
    API_BASE_URL = "https://api.spotify.com/v1"

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        """Inicializa el cliente de Spotify.

        Args:
            client_id: Client ID de la aplicación Spotify.
            client_secret: Client Secret de la aplicación Spotify.
            http_client: Instancia opcional de httpx.AsyncClient para pruebas.
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self._http_client = http_client
        self._access_token: str | None = None
        self._token_expires_at: float = 0.0

    async def _get_client(self) -> httpx.AsyncClient:
        """Devuelve el cliente HTTP interno o crea uno temporal."""
        if self._http_client is not None:
            return self._http_client
        return httpx.AsyncClient(timeout=15.0)

    async def get_access_token(self) -> str:
        """Obtiene un token de acceso válido utilizando Client Credentials Flow.

        Returns:
            str: Token de acceso Bearer listo para consumo.

        Raises:
            RuntimeError: Si las credenciales no son válidas o la API responde con error.
        """
        if self._access_token and time.time() < (self._token_expires_at - 60):
            return self._access_token

        if not self.client_id or not self.client_secret:
            raise RuntimeError("Credenciales de Spotify no configuradas (CLIENT_ID o CLIENT_SECRET vacíos).")

        data = {"grant_type": "client_credentials"}
        auth = (self.client_id, self.client_secret)

        client = await self._get_client()
        try:
            response = await client.post(self.TOKEN_URL, data=data, auth=auth)
            response.raise_for_status()
            payload = response.json()
            self._access_token = payload["access_token"]
            expires_in = payload.get("expires_in", 3600)
            self._token_expires_at = time.time() + float(expires_in)
            return self._access_token
        finally:
            if self._http_client is None:
                await client.aclose()

    async def fetch_playlist_tracks(self, playlist_id: str) -> list[Track]:
        """Descarga y pagina todos los temas de una playlist de Spotify.

        Intenta primero la Web API oficial. Si responde con error (por ejemplo
        restricciones de scope en playlists públicas), activa automáticamente el
        extractor de embed público de alta resiliencia.

        Args:
            playlist_id: ID alfanumérico de la playlist en Spotify.

        Returns:
            list[Track]: Lista de canciones normalizadas con metadatos completos.
        """
        if not playlist_id:
            return []

        client = await self._get_client()
        try:
            # 1. Intento primario con Web API
            try:
                token = await self.get_access_token()
                headers = {"Authorization": f"Bearer {token}"}
                url = f"{self.API_BASE_URL}/playlists/{playlist_id}/tracks?limit=100"
                tracks: list[Track] = []

                while url:
                    response = await client.get(url, headers=headers)
                    response.raise_for_status()
                    payload = response.json()

                    for item in payload.get("items", []):
                        raw_track = item.get("track")
                        if not raw_track or not raw_track.get("id"):
                            continue

                        track_id = str(raw_track["id"])
                        title = str(raw_track.get("name", "Unknown Title"))
                        artists_list = [a.get("name", "") for a in raw_track.get("artists", []) if a.get("name")]
                        artist = ", ".join(artists_list) if artists_list else "Unknown Artist"

                        album_data = raw_track.get("album", {})
                        album = str(album_data.get("name", ""))

                        images = album_data.get("images", [])
                        cover_url = images[0].get("url", "") if images else ""
                        duration_ms = int(raw_track.get("duration_ms", 0))

                        tracks.append(
                            Track(
                                id=track_id,
                                title=title,
                                artist=artist,
                                album=album,
                                cover_url=cover_url,
                                duration_ms=duration_ms,
                            )
                        )
                    url = payload.get("next")

                if tracks:
                    return tracks
            except Exception as api_err:
                logger.info(f"Web API de Spotify no disponible para tracks ({api_err}). Activando extractor público...")

            # 2. Fallback de alta resiliencia vía Embed Público
            return await self._fetch_via_public_embed(client, playlist_id)
        finally:
            if self._http_client is None:
                await client.aclose()

    async def _fetch_via_public_embed(self, client: httpx.AsyncClient, playlist_id: str) -> list[Track]:
        """Extrae canciones desde el componente embed público de Spotify.

        Args:
            client: Cliente HTTP asíncrono.
            playlist_id: ID de la playlist.

        Returns:
            list[Track]: Lista de canciones normalizadas.
        """
        embed_url = f"https://open.spotify.com/embed/playlist/{playlist_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        response = await client.get(embed_url, headers=headers, follow_redirects=True)
        response.raise_for_status()

        match = re.search(r'__NEXT_DATA__.*?>(.*?)</script>', response.text)
        if not match:
            logger.warning("No se encontró el bloque __NEXT_DATA__ en la página embed de Spotify.")
            return []

        data = json.loads(match.group(1))
        entity = data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})
        track_list = entity.get("trackList", [])

        cover_sources = entity.get("coverArt", {}).get("sources", [])
        default_cover = cover_sources[0].get("url", "") if cover_sources else ""
        album_name = entity.get("name", "Spotify Playlist")

        tracks: list[Track] = []
        for item in track_list:
            uri = str(item.get("uri", ""))
            track_id = uri.split(":")[-1] if uri else str(item.get("uid", ""))
            title = str(item.get("title", "Unknown Title"))
            artist = str(item.get("subtitle", "Unknown Artist"))
            duration_ms = int(item.get("duration", 0))

            tracks.append(
                Track(
                    id=track_id,
                    title=title,
                    artist=artist,
                    album=album_name,
                    cover_url=default_cover,
                    duration_ms=duration_ms,
                )
            )

        logger.info(f"Extractor público de Spotify recuperó exitosamente {len(tracks)} canciones.")
        return tracks
