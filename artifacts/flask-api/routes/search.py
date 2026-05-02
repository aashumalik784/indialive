import re
from collections import Counter
from flask import Blueprint, request, jsonify, session
from models import User, Video

search_bp = Blueprint("search", __name__)


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


@search_bp.route("/api/search", methods=["GET"])
def search():
    q = request.args.get("q", "").strip()
    kind = request.args.get("kind", "all")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    current_user = get_current_user()

    if not q:
        return jsonify({"videos": [], "users": [], "query": q}), 200

    results = {}

    if kind in ("videos", "all"):
        video_pagination = (
            Video.query
            .filter(Video.caption.ilike(f"%{q}%"))
            .order_by(Video.view_count.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )
        results["videos"] = [
            v.to_dict(current_user.id if current_user else None)
            for v in video_pagination.items
        ]
        results["video_total"] = video_pagination.total

    if kind in ("users", "all"):
        user_pagination = (
            User.query
            .filter(User.username.ilike(f"%{q}%"))
            .order_by(User.username)
            .paginate(page=page, per_page=per_page, error_out=False)
        )
        results["users"] = [u.to_dict() for u in user_pagination.items]
        results["user_total"] = user_pagination.total

    results["query"] = q
    return jsonify(results), 200


@search_bp.route("/api/search/trending", methods=["GET"])
def trending():
    current_user = get_current_user()

    # Trending videos — top 12 by view count
    top_videos = (
        Video.query
        .order_by(Video.view_count.desc())
        .limit(12)
        .all()
    )

    # Extract hashtags from all captions
    all_captions = [v.caption for v in Video.query.with_entities(Video.caption).all()]
    hashtag_counter = Counter()
    for caption in all_captions:
        tags = re.findall(r"#(\w+)", caption)
        for tag in tags:
            hashtag_counter[tag.lower()] += 1

    trending_tags = [
        {"tag": tag, "count": count}
        for tag, count in hashtag_counter.most_common(15)
    ]

    # Popular creators — top 8 by video count
    all_users = User.query.all()
    creators = sorted(all_users, key=lambda u: len(u.videos), reverse=True)[:8]

    return jsonify({
        "trending_videos": [
            v.to_dict(current_user.id if current_user else None)
            for v in top_videos
        ],
        "trending_tags": trending_tags,
        "popular_creators": [u.to_dict() for u in creators if len(u.videos) > 0],
    }), 200
