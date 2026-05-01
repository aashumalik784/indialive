from flask import Blueprint, request, jsonify, session
from models import db, User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict()}), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    identifier = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None}), 200

    user = User.query.get(user_id)
    if not user:
        session.pop("user_id", None)
        return jsonify({"user": None}), 200

    return jsonify({"user": user.to_dict()}), 200
