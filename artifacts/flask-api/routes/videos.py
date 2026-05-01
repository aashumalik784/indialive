import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, session, current_app
from models import db, User, Video

videos_bp = Blueprint("videos", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp"}


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def configure_cloudinary():
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.environ.get("CLOUDINARY_API_KEY", "")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")

    if not cloud_name or not api_key or not api_secret:
        raise ValueError(
            f"Cloudinary credentials missing. "
            f"CLOUDINARY_CLOUD_NAME={'set' if cloud_name else 'MISSING'}, "
            f"CLOUDINARY_API_KEY={'set' if api_key else 'MISSING'}, "
            f"CLOUDINARY_API_SECRET={'set' if api_secret else 'MISSING'}"
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    return cloud_name


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
        return jsonify({"error": "No video file provided. Make sure the form field is named 'video'."}), 400

    video_file = request.files["video"]
    caption = request.form.get("caption", "").strip()

    if not caption:
        return jsonify({"error": "Caption is required"}), 400

    if video_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(video_file.filename):
        return jsonify({"error": f"File type not supported. Use: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    try:
        cloud_name = configure_cloudinary()
    except ValueError as e:
        current_app.logger.error(f"Cloudinary config error: {e}")
        return jsonify({"error": f"Server configuration error: {str(e)}"}), 500

    try:
        video_data = video_file.read()
        file_size_mb = len(video_data) / (1024 * 1024)
        current_app.logger.info(f"Uploading video: {video_file.filename}, size: {file_size_mb:.1f}MB")

        if file_size_mb > 10:
            import io
            upload_result = cloudinary.uploader.upload_large(
                io.BytesIO(video_data),
                resource_type="video",
                folder="india_live",
                chunk_size=6 * 1024 * 1024,
                timeout=300,
            )
        else:
            import io
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(video_data),
                resource_type="video",
                folder="india_live",
                timeout=120,
            )

        current_app.logger.info(f"Cloudinary upload success: {upload_result.get('public_id')}")

    except cloudinary.exceptions.Error as e:
        current_app.logger.error(f"Cloudinary upload error: {e}")
        return jsonify({"error": f"Video upload to Cloudinary failed: {str(e)}"}), 502
    except Exception as e:
        current_app.logger.error(f"Unexpected upload error: {e}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    video_url = upload_result.get("secure_url")
    public_id = upload_result.get("public_id")
    duration = upload_result.get("duration")
    thumbnail_url = (
        f"https://res.cloudinary.com/{cloud_name}/video/upload"
        f"/so_0,w_400,h_711,c_fill,f_jpg/{public_id}.jpg"
    )

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
        try:
            configure_cloudinary()
            cloudinary.uploader.destroy(video.cloudinary_public_id, resource_type="video")
        except Exception as e:
            current_app.logger.warning(f"Failed to delete from Cloudinary: {e}")

    db.session.delete(video)
    db.session.commit()
    return jsonify({"message": "Video deleted"}), 200


@videos_bp.route("/api/videos/<int:video_id>/view", methods=["POST"])
def increment_view(video_id):
    video = Video.query.get_or_404(video_id)
    video.view_count += 1
    db.session.commit()
    return jsonify({"view_count": video.view_count}), 200


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
