import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client = None
_service_client: Client = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY"),
        )
    return _client


def get_service_client() -> Client:
    global _service_client
    if _service_client is None:
        _service_client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY"),
        )
    return _service_client
