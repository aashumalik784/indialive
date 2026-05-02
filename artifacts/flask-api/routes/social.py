from flask import Blueprint, jsonify, session
from models import db, User, Video, Block

social_bp = Blueprint("social", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@social_bp.route("/api/users/<int:user_id>/block", methods=["POST"])
def toggle_block(user_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    if current_user.id == user_id:
        return jsonify({"error": "Cannot block yourself"}), 400

    User.query.get_or_404(user_id)
    existing = Block.query.filter_by(blocker_id=current_user.id, blocked_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"blocked": False}), 200
    else:
        block = Block(blocker_id=current_user.id, blocked_id=user_id)
        db.session.add(block)
        db.session.commit()
        return jsonify({"blocked": True}), 200


@social_bp.route("/api/videos/<int:video_id>/pin", methods=["POST"])
def toggle_pin(video_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    video = Video.query.get_or_404(video_id)
    if video.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    video.pinned = not video.pinned
    db.session.commit()
    return jsonify({"pinned": video.pinned}), 200


@social_bp.route("/api/users/<string:username>/analytics", methods=["GET"])
def get_analytics(username):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    user = User.query.filter_by(username=username).first_or_404()
    if user.id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    videos = Video.query.filter_by(user_id=user.id).order_by(Video.created_at.desc()).all()
    total_views = sum(v.view_count for v in videos)
    total_likes = sum(len(v.likes) for v in videos)
    total_comments = sum(len(v.comments) for v in videos)

    video_stats = [
        {
            "id": v.id,
            "caption": v.caption[:60],
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count,
            "like_count": len(v.likes),
            "comment_count": len(v.comments),
            "created_at": v.created_at.isoformat(),
        }
        for v in videos[:20]
    ]

    return jsonify({
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "follower_count": user.followers.count(),
        "following_count": user.following.count(),
        "video_count": len(videos),
        "videos": video_stats,
    }), 200
