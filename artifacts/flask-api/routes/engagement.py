from flask import Blueprint, request, jsonify, session
from models import db, User, Video, Like, Comment, Notification

engagement_bp = Blueprint("engagement", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def create_notification(user_id, actor_id, notif_type, video_id=None):
    if user_id == actor_id:
        return
    notif = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=notif_type,
        video_id=video_id,
    )
    db.session.add(notif)


@engagement_bp.route("/api/videos/<int:video_id>/like", methods=["POST"])
def toggle_like(video_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    video = Video.query.get_or_404(video_id)
    existing_like = Like.query.filter_by(
        user_id=current_user.id, video_id=video_id
    ).first()

    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        liked = False
    else:
        like = Like(user_id=current_user.id, video_id=video_id)
        db.session.add(like)
        create_notification(video.user_id, current_user.id, "like", video_id)
        db.session.commit()
        liked = True

    like_count = Like.query.filter_by(video_id=video_id).count()
    return jsonify({"liked": liked, "like_count": like_count}), 200


@engagement_bp.route("/api/videos/<int:video_id>/comments", methods=["GET"])
def get_comments(video_id):
    Video.query.get_or_404(video_id)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    pagination = Comment.query.filter_by(video_id=video_id).order_by(
        Comment.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "comments": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    }), 200


@engagement_bp.route("/api/videos/<int:video_id>/comments", methods=["POST"])
def add_comment(video_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    video = Video.query.get_or_404(video_id)
    data = request.get_json()
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Comment content is required"}), 400

    if len(content) > 500:
        return jsonify({"error": "Comment too long (max 500 characters)"}), 400

    comment = Comment(user_id=current_user.id, video_id=video_id, content=content)
    db.session.add(comment)
    create_notification(video.user_id, current_user.id, "comment", video_id)
    db.session.commit()

    return jsonify({"comment": comment.to_dict()}), 201


@engagement_bp.route("/api/videos/<int:video_id>/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(video_id, comment_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
