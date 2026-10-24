"""Cliente asíncrono para interactuar con la Web API de Spotify.

Implementa el flujo de autorización Client Credentials para consultar
playlists públicas y extraer metadatos estructurados de canciones.
"""

import time
import httpx
from pydantic import BaseModel, Field


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

        Args:
            playlist_id: ID alfanumérico de la playlist en Spotify.

        Returns:
            list[Track]: Lista de canciones normalizadas con metadatos completos.

        Raises:
            RuntimeError: Si la petición a la API falla o la playlist no existe.
        """
        if not playlist_id:
            return []

        token = await self.get_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{self.API_BASE_URL}/playlists/{playlist_id}/tracks?limit=100"

        client = await self._get_client()
        tracks: list[Track] = []

        try:
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
            return tracks
        finally:
            if self._http_client is None:
                await client.aclose()
