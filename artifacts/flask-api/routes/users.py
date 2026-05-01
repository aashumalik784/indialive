from flask import Blueprint, jsonify, session
from models import User

users_bp = Blueprint("users", __name__)


@users_bp.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


@users_bp.route("/api/users/<string:username>", methods=["GET"])
def get_user_by_username(username):
    user = User.query.filter_by(username=username).first_or_404()
    return jsonify({"user": user.to_dict()}), 200
