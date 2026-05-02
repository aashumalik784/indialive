from flask import Blueprint, jsonify, session
from models import db, User, Video, Bookmark

bookmarks_bp = Blueprint("bookmarks", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@bookmarks_bp.route("/api/bookmarks", methods=["GET"])
def get_bookmarks():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    bms = (
        Bookmark.query
        .filter_by(user_id=current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    videos = []
    for bm in bms:
        v = Video.query.get(bm.video_id)
        if v and v.privacy == "public":
            videos.append(v.to_dict(current_user.id))
    return jsonify({"videos": videos, "total": len(videos)}), 200


@bookmarks_bp.route("/api/videos/<int:video_id>/bookmark", methods=["POST"])
def toggle_bookmark(video_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    Video.query.get_or_404(video_id)
    existing = Bookmark.query.filter_by(user_id=current_user.id, video_id=video_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"bookmarked": False}), 200
    else:
        bm = Bookmark(user_id=current_user.id, video_id=video_id)
        db.session.add(bm)
        db.session.commit()
        return jsonify({"bookmarked": True}), 200
