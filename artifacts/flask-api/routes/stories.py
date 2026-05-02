from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, session
from models import db, User, Story
import cloudinary
import cloudinary.uploader
import os

stories_bp = Blueprint("stories", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def configure_cloudinary():
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
        api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
        secure=True,
    )


@stories_bp.route("/api/stories", methods=["GET"])
def get_stories():
    current_user = get_current_user()
    now = datetime.now(timezone.utc)

    if current_user:
        following_ids = [f.following_id for f in current_user.following.all()]
        following_ids.append(current_user.id)
        stories = Story.query.filter(
            Story.user_id.in_(following_ids),
            Story.expires_at > now,
        ).order_by(Story.created_at.desc()).all()
    else:
        stories = Story.query.filter(Story.expires_at > now).order_by(Story.created_at.desc()).limit(20).all()

    grouped = {}
    for s in stories:
        uid = s.user_id
        if uid not in grouped:
            grouped[uid] = {
                "user": {
                    "id": s.author.id,
                    "username": s.author.username,
                    "avatar_url": s.author.avatar_url,
                },
                "stories": [],
            }
        grouped[uid]["stories"].append(s.to_dict())

    return jsonify({"story_groups": list(grouped.values())}), 200


@stories_bp.route("/api/stories", methods=["POST"])
def create_story():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    if "media" not in request.files:
        return jsonify({"error": "No media file"}), 400

    media_file = request.files["media"]
    caption = request.form.get("caption", "").strip()
    duration_hours = int(request.form.get("duration_hours", 24))

    try:
        configure_cloudinary()
        file_data = media_file.read()
        mime = media_file.content_type or ""
        resource_type = "video" if mime.startswith("video") else "image"
        result = cloudinary.uploader.upload(
            file_data,
            resource_type=resource_type,
            folder="india_live/stories",
        )
        media_url = result["secure_url"]
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    expires_at = datetime.now(timezone.utc) + timedelta(hours=duration_hours)
    story = Story(
        user_id=current_user.id,
        media_url=media_url,
        media_type="video" if mime.startswith("video") else "image",
        caption=caption or None,
        expires_at=expires_at,
    )
    db.session.add(story)
    db.session.commit()
    return jsonify({"story": story.to_dict()}), 201


@stories_bp.route("/api/stories/user/<int:user_id>", methods=["GET"])
def get_user_stories(user_id):
    now = datetime.now(timezone.utc)
    stories = Story.query.filter(
        Story.user_id == user_id,
        Story.expires_at > now,
    ).order_by(Story.created_at.asc()).all()
    return jsonify({"stories": [s.to_dict() for s in stories]}), 200


@stories_bp.route("/api/stories/<int:story_id>/view", methods=["POST"])
def view_story(story_id):
    story = Story.query.get_or_404(story_id)
    story.view_count += 1
    db.session.commit()
    return jsonify({"view_count": story.view_count}), 200


@stories_bp.route("/api/stories/<int:story_id>", methods=["DELETE"])
def delete_story(story_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    story = Story.query.get_or_404(story_id)
    if story.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403
    db.session.delete(story)
    db.session.commit()
    return jsonify({"message": "Story deleted"}), 200
