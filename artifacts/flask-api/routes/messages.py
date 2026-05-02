from flask import Blueprint, request, jsonify, session
from sqlalchemy import or_, and_
from models import db, User, Message

messages_bp = Blueprint("messages", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@messages_bp.route("/api/messages/conversations", methods=["GET"])
def get_conversations():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    all_msgs = Message.query.filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id,
        )
    ).order_by(Message.created_at.desc()).all()

    seen = set()
    convos = []
    for msg in all_msgs:
        other_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_id in seen:
            continue
        seen.add(other_id)
        other = User.query.get(other_id)
        if not other:
            continue
        unread = Message.query.filter_by(
            sender_id=other_id,
            receiver_id=current_user.id,
            read=False,
        ).count()
        convos.append({
            "user": {
                "id": other.id,
                "username": other.username,
                "avatar_url": other.avatar_url,
                "display_name": other.display_name or other.username,
            },
            "last_message": msg.to_dict(),
            "unread_count": unread,
        })

    return jsonify({"conversations": convos}), 200


@messages_bp.route("/api/messages/<int:other_user_id>", methods=["GET"])
def get_messages(other_user_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    User.query.get_or_404(other_user_id)

    msgs = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).all()

    # Mark unread as read
    Message.query.filter_by(
        sender_id=other_user_id,
        receiver_id=current_user.id,
        read=False,
    ).update({"read": True})
    db.session.commit()

    return jsonify({"messages": [m.to_dict() for m in msgs]}), 200


@messages_bp.route("/api/messages/<int:other_user_id>", methods=["POST"])
def send_message(other_user_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    User.query.get_or_404(other_user_id)
    data = request.get_json() or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Message cannot be empty"}), 400
    if len(content) > 1000:
        return jsonify({"error": "Message too long"}), 400

    msg = Message(
        sender_id=current_user.id,
        receiver_id=other_user_id,
        content=content,
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201


@messages_bp.route("/api/messages/unread-count", methods=["GET"])
def unread_count():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"count": 0}), 200
    count = Message.query.filter_by(receiver_id=current_user.id, read=False).count()
    return jsonify({"count": count}), 200
