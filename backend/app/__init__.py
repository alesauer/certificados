from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes.public import public_bp
from .routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Retorna 413 em JSON quando o arquivo excede MAX_CONTENT_LENGTH
    @app.errorhandler(413)
    def request_too_large(e):
        from flask import jsonify
        return jsonify({"error": "Arquivo muito grande. O tamanho máximo permitido é 20 MB."}), 413

    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app
