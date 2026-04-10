import asyncio

import httpx
import structlog

from src.shared.value_objects.address import AddressDTO

logger = structlog.get_logger()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "SantaRitaDiesel/0.1 (contato@santaritadiesel.com)"
REQUEST_TIMEOUT = 8.0
VIACEP_URL = "https://viacep.com.br/ws/{cep}/json/"


class GeocodingService:
    @staticmethod
    async def geocode(address: AddressDTO) -> tuple[float, float] | None:
        if not address.is_geocodable():
            return None

        query = address.to_query_string()
        params = {
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": "br",
            "addressdetails": 0,
        }
        headers = {"User-Agent": USER_AGENT, "Accept-Language": "pt-BR"}

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.get(NOMINATIM_URL, params=params, headers=headers)
                if response.status_code != 200:
                    await logger.awarning(
                        "geocoding_failed",
                        status=response.status_code,
                        query=query,
                    )
                    return None

                data = response.json()
                if not data or not isinstance(data, list):
                    return None

                first = data[0]
                lat = float(first.get("lat"))
                lon = float(first.get("lon"))
                return lat, lon
        except (httpx.HTTPError, ValueError, KeyError, TypeError, asyncio.TimeoutError) as exc:
            await logger.awarning("geocoding_exception", error=str(exc), query=query)
            return None

    @staticmethod
    async def lookup_cep(cep: str) -> dict | None:
        cleaned = "".join(ch for ch in cep if ch.isdigit())
        if len(cleaned) != 8:
            return None

        url = VIACEP_URL.format(cep=cleaned)
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return None
                data = response.json()
                if data.get("erro"):
                    return None
                return {
                    "zip_code": cleaned,
                    "street": data.get("logradouro") or None,
                    "complement": data.get("complemento") or None,
                    "district": data.get("bairro") or None,
                    "city": data.get("localidade") or None,
                    "state": data.get("uf") or None,
                }
        except (httpx.HTTPError, ValueError, TypeError, asyncio.TimeoutError) as exc:
            await logger.awarning("cep_lookup_exception", error=str(exc), cep=cleaned)
            return None


geocoding_service = GeocodingService()
