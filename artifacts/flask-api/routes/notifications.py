from flask import Blueprint, jsonify, session
from models import db, User, Notification

notifications_bp = Blueprint("notifications", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    notifs = (
        Notification.query
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    unread_count = Notification.query.filter_by(
        user_id=current_user.id, read=False
    ).count()

    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "unread_count": unread_count,
    }), 200


@notifications_bp.route("/api/notifications/unread-count", methods=["GET"])
def unread_count():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"unread_count": 0}), 200

    count = Notification.query.filter_by(
        user_id=current_user.id, read=False
    ).count()
    return jsonify({"unread_count": count}), 200


@notifications_bp.route("/api/notifications/read-all", methods=["POST"])
def mark_all_read():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    Notification.query.filter_by(
        user_id=current_user.id, read=False
    ).update({"read": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200
