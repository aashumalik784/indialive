import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, jsonify, session, request
from models import db, User

users_bp = Blueprint("users", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@users_bp.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    current_user = get_current_user()
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict(current_user)}), 200


@users_bp.route("/api/users/<string:username>", methods=["GET"])
def get_user_by_username(username):
    current_user = get_current_user()
    user = User.query.filter_by(username=username).first_or_404()
    return jsonify({"user": user.to_dict(current_user)}), 200


@users_bp.route("/api/users/me", methods=["PUT"])
def update_profile():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json()
    username = data.get("username", "").strip()
    display_name = data.get("display_name", "").strip()
    bio = data.get("bio", "").strip()
    avatar_url = data.get("avatar_url", "").strip()

    if display_name is not None:
        current_user.display_name = display_name[:100] if display_name else None

    if username and username != current_user.username:
        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400
        if not username.replace("_", "").replace(".", "").isalnum():
            return jsonify({"error": "Username can only contain letters, numbers, _ and ."}), 400
        existing = User.query.filter_by(username=username).first()
        if existing:
            return jsonify({"error": "Username already taken"}), 409
        current_user.username = username

    if bio is not None:
        current_user.bio = bio[:300] if bio else None

    if avatar_url is not None:
        current_user.avatar_url = avatar_url[:500] if avatar_url else None

    db.session.commit()
    return jsonify({"user": current_user.to_dict()}), 200


@users_bp.route("/api/auth/password", methods=["PUT"])
def change_password():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json()
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200


def configure_cloudinary():
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
        api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
        secure=True,
    )


@users_bp.route("/api/users/me/avatar", methods=["POST"])
def upload_avatar():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    if "avatar" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["avatar"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    allowed = {"jpg", "jpeg", "png", "gif", "webp", "heic", "heif"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        return jsonify({"error": "Sirf image files allowed hain (JPG, PNG, GIF, WebP)"}), 400

    try:
        configure_cloudinary()
        result = cloudinary.uploader.upload(
            file,
            folder="india_live/avatars",
            public_id=f"user_{current_user.id}",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
            ],
        )
        avatar_url = result["secure_url"]
        current_user.avatar_url = avatar_url
        db.session.commit()
        return jsonify({"avatar_url": avatar_url, "user": current_user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@users_bp.route("/api/users/me/delete", methods=["DELETE"])
def delete_account():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    password = data.get("password", "")
    if not current_user.check_password(password):
        return jsonify({"error": "Password is incorrect"}), 400

    db.session.delete(current_user)
    db.session.commit()
    session.clear()
    return jsonify({"message": "Account deleted"}), 200
