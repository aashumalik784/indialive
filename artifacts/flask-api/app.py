import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db

from routes.auth import auth_bp
from routes.videos import videos_bp
from routes.engagement import engagement_bp
from routes.users import users_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True, origins=["*"])

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(videos_bp)
    app.register_blueprint(engagement_bp)
    app.register_blueprint(users_bp)

    @app.route("/api/healthz")
    def healthz():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
