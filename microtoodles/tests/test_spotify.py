"""Pruebas unitarias para SpotifyClient."""

import pytest
import httpx

from spotify import SpotifyClient, Track


@pytest.mark.asyncio
async def test_spotify_token_acquisition():
    """Verifica la obtención y almacenamiento en caché del token de acceso."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url == httpx.URL("https://accounts.spotify.com/api/token"):
            return httpx.Response(
                status_code=200,
                json={"access_token": "mock_token_123", "expires_in": 3600, "token_type": "Bearer"},
            )
        return httpx.Response(status_code=404)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = SpotifyClient("client_id", "client_secret", http_client=http_client)
        token = await client.get_access_token()
        assert token == "mock_token_123"
        assert client._access_token == "mock_token_123"

        # Segunda llamada debe usar el token en memoria sin volver a peticionar
        cached_token = await client.get_access_token()
        assert cached_token == "mock_token_123"


@pytest.mark.asyncio
async def test_fetch_playlist_tracks_pagination():
    """Valida la paginación y normalización de canciones desde la API de Spotify."""
    page1 = {
        "items": [
            {
                "track": {
                    "id": "trk_1",
                    "name": "Track One",
                    "artists": [{"name": "Dillom"}, {"name": "Bhavi"}],
                    "album": {
                        "name": "Post Mortem",
                        "images": [{"url": "https://example.com/cover1.jpg"}],
                    },
                    "duration_ms": 195000,
                }
            },
            {
                "track": None  # Item nulo a ignorar
            },
        ],
        "next": "https://api.spotify.com/v1/playlists/test_pl/tracks?offset=100&limit=100",
    }

    page2 = {
        "items": [
            {
                "track": {
                    "id": "trk_2",
                    "name": "Track Two",
                    "artists": [{"name": "Wos"}],
                    "album": {
                        "name": "Caravana",
                        "images": [{"url": "https://example.com/cover2.jpg"}],
                    },
                    "duration_ms": 210000,
                }
            }
        ],
        "next": None,
    }

    def mock_handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        if "accounts.spotify.com" in url_str:
            return httpx.Response(
                status_code=200,
                json={"access_token": "mock_token", "expires_in": 3600},
            )
        if "limit=100" in url_str and "offset=100" not in url_str:
            return httpx.Response(status_code=200, json=page1)
        if "offset=100" in url_str:
            return httpx.Response(status_code=200, json=page2)
        return httpx.Response(status_code=404)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = SpotifyClient("cid", "csec", http_client=http_client)
        tracks = await client.fetch_playlist_tracks("test_pl")

        assert len(tracks) == 2
        assert tracks[0].id == "trk_1"
        assert tracks[0].title == "Track One"
        assert tracks[0].artist == "Dillom, Bhavi"
        assert tracks[0].album == "Post Mortem"
        assert tracks[0].cover_url == "https://example.com/cover1.jpg"

        assert tracks[1].id == "trk_2"
        assert tracks[1].title == "Track Two"
        assert tracks[1].artist == "Wos"


@pytest.mark.asyncio
async def test_missing_credentials_raises():
    """Valida que la falta de credenciales dispare un error descriptivo."""
    client = SpotifyClient("", "")
    with pytest.raises(RuntimeError, match="Credenciales de Spotify no configuradas"):
        await client.get_access_token()
