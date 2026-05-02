from flask import Blueprint, jsonify, request, session
from models import db, User, Video, Follow, Notification

follow_bp = Blueprint("follow", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@follow_bp.route("/api/users/<username>/follow", methods=["POST"])
def toggle_follow(username):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    target = User.query.filter_by(username=username).first_or_404()

    if target.id == current_user.id:
        return jsonify({"error": "Cannot follow yourself"}), 400

    existing = Follow.query.filter_by(
        follower_id=current_user.id,
        following_id=target.id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({
            "is_following": False,
            "follower_count": target.followers.count(),
        }), 200
    else:
        follow = Follow(follower_id=current_user.id, following_id=target.id)
        db.session.add(follow)
        notif = Notification(
            user_id=target.id,
            actor_id=current_user.id,
            type="follow",
        )
        db.session.add(notif)
        db.session.commit()
        return jsonify({
            "is_following": True,
            "follower_count": target.followers.count(),
        }), 200


@follow_bp.route("/api/users/<username>/followers", methods=["GET"])
def get_followers(username):
    current_user = get_current_user()
    target = User.query.filter_by(username=username).first_or_404()
    page = request.args.get("page", 1, type=int)
    per_page = 20

    pagination = Follow.query.filter_by(following_id=target.id).order_by(
        Follow.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    users = []
    for f in pagination.items:
        u = User.query.get(f.follower_id)
        if u:
            d = u.to_dict(current_user)
            users.append(d)

    return jsonify({
        "users": users,
        "total": pagination.total,
        "has_next": pagination.has_next,
    }), 200


@follow_bp.route("/api/users/<username>/following", methods=["GET"])
def get_following(username):
    current_user = get_current_user()
    target = User.query.filter_by(username=username).first_or_404()
    page = request.args.get("page", 1, type=int)
    per_page = 20

    pagination = Follow.query.filter_by(follower_id=target.id).order_by(
        Follow.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    users = []
    for f in pagination.items:
        u = User.query.get(f.following_id)
        if u:
            d = u.to_dict(current_user)
            users.append(d)

    return jsonify({
        "users": users,
        "total": pagination.total,
        "has_next": pagination.has_next,
    }), 200


@follow_bp.route("/api/feed/following", methods=["GET"])
def following_feed():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    following_ids = [f.following_id for f in Follow.query.filter_by(follower_id=current_user.id).all()]

    if not following_ids:
        return jsonify({
            "videos": [],
            "total": 0,
            "pages": 0,
            "has_next": False,
            "has_prev": False,
        }), 200

    pagination = Video.query.filter(
        Video.user_id.in_(following_ids)
    ).order_by(Video.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "videos": [v.to_dict(current_user.id) for v in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }), 200
