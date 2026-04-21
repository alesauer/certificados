from functools import wraps
from flask import request, jsonify, current_app
from .supabase_service import get_client


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token não fornecido"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            client = get_client()
            user = client.auth.get_user(token)
            if not user or not user.user:
                return jsonify({"error": "Token inválido"}), 401
        except Exception:
            return jsonify({"error": "Token inválido ou expirado"}), 401

        return f(*args, **kwargs)

    return decorated
