import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db

from routes.auth import auth_bp
from routes.videos import videos_bp
from routes.engagement import engagement_bp
from routes.users import users_bp
from routes.search import search_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True, origins=["*"])

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(videos_bp)
    app.register_blueprint(engagement_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(search_bp)

    @app.route("/api/healthz")
    def healthz():
        return jsonify({"status": "ok"}), 200

    @app.route("/api/cloudinary/test")
    def cloudinary_test():
        import os
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
        api_key = os.environ.get("CLOUDINARY_API_KEY", "")
        api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")
        return jsonify({
            "CLOUDINARY_CLOUD_NAME": cloud_name if cloud_name else "MISSING",
            "CLOUDINARY_API_KEY": f"...{api_key[-4:]}" if api_key else "MISSING",
            "CLOUDINARY_API_SECRET": f"...{api_secret[-4:]}" if api_secret else "MISSING",
            "all_set": bool(cloud_name and api_key and api_secret),
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def request_too_large(e):
        return jsonify({"error": "File too large. Maximum upload size is 500MB."}), 413

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
