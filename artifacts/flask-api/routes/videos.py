import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, session, current_app
from models import db, User, Video

videos_bp = Blueprint("videos", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@videos_bp.route("/api/videos", methods=["GET"])
def get_videos():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    current_user = get_current_user()

    pagination = Video.query.order_by(Video.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "videos": [v.to_dict(current_user.id if current_user else None) for v in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }), 200


@videos_bp.route("/api/videos/<int:video_id>", methods=["GET"])
def get_video(video_id):
    current_user = get_current_user()
    video = Video.query.get_or_404(video_id)
    video.view_count += 1
    db.session.commit()
    return jsonify({"video": video.to_dict(current_user.id if current_user else None)}), 200


@videos_bp.route("/api/videos", methods=["POST"])
def upload_video():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files["video"]
    caption = request.form.get("caption", "").strip()

    if not caption:
        return jsonify({"error": "Caption is required"}), 400

    if video_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"],
    )

    upload_result = cloudinary.uploader.upload(
        video_file,
        resource_type="video",
        folder="india_live",
        eager=[{"width": 400, "height": 711, "crop": "fill", "format": "jpg"}],
        eager_async=True,
    )

    video_url = upload_result.get("secure_url")
    public_id = upload_result.get("public_id")
    duration = upload_result.get("duration")
    thumbnail_url = f"https://res.cloudinary.com/{current_app.config['CLOUDINARY_CLOUD_NAME']}/video/upload/so_0/{public_id}.jpg"

    video = Video(
        user_id=current_user.id,
        caption=caption,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        cloudinary_public_id=public_id,
        duration=duration,
    )
    db.session.add(video)
    db.session.commit()

    return jsonify({"video": video.to_dict(current_user.id)}), 201


@videos_bp.route("/api/videos/<int:video_id>", methods=["DELETE"])
def delete_video(video_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    video = Video.query.get_or_404(video_id)
    if video.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    if video.cloudinary_public_id:
        cloudinary.config(
            cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
            api_key=current_app.config["CLOUDINARY_API_KEY"],
            api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        )
        cloudinary.uploader.destroy(video.cloudinary_public_id, resource_type="video")

    db.session.delete(video)
    db.session.commit()
    return jsonify({"message": "Video deleted"}), 200


@videos_bp.route("/api/users/<int:user_id>/videos", methods=["GET"])
def get_user_videos(user_id):
    current_user = get_current_user()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)

    User.query.get_or_404(user_id)
    pagination = Video.query.filter_by(user_id=user_id).order_by(
        Video.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "videos": [v.to_dict(current_user.id if current_user else None) for v in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    }), 200
