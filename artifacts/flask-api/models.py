from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("follower_id", "following_id", name="unique_follow"),)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    videos = db.relationship("Video", backref="author", lazy=True, cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="user", lazy=True, cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="author", lazy=True, cascade="all, delete-orphan")
    following = db.relationship("Follow", foreign_keys="Follow.follower_id", backref="follower", lazy="dynamic", cascade="all, delete-orphan")
    followers = db.relationship("Follow", foreign_keys="Follow.following_id", backref="following_user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_following(self, user):
        return self.following.filter_by(following_id=user.id).first() is not None

    def to_dict(self, current_user=None):
        data = {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "created_at": self.created_at.isoformat(),
            "video_count": len(self.videos),
            "follower_count": self.followers.count(),
            "following_count": self.following.count(),
            "is_following": False,
        }
        if current_user and current_user.id != self.id:
            data["is_following"] = self.is_following(current_user) if False else current_user.is_following(self)
        return data


class Video(db.Model):
    __tablename__ = "videos"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    caption = db.Column(db.String(500), nullable=False)
    video_url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500), nullable=True)
    cloudinary_public_id = db.Column(db.String(200), nullable=True)
    duration = db.Column(db.Float, nullable=True)
    view_count = db.Column(db.Integer, default=0)
    duet_of = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    likes = db.relationship("Like", backref="video", lazy=True, cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="video", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        liked_by_user = False
        if current_user_id:
            liked_by_user = any(like.user_id == current_user_id for like in self.likes)
        return {
            "id": self.id,
            "user_id": self.user_id,
            "author": {
                "id": self.author.id,
                "username": self.author.username,
                "avatar_url": self.author.avatar_url,
            },
            "caption": self.caption,
            "video_url": self.video_url,
            "thumbnail_url": self.thumbnail_url,
            "duration": self.duration,
            "view_count": self.view_count,
            "like_count": len(self.likes),
            "comment_count": len(self.comments),
            "liked_by_user": liked_by_user,
            "duet_of": self.duet_of,
            "created_at": self.created_at.isoformat(),
        }


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "video_id", name="unique_user_video_like"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "video_id": self.video_id,
            "created_at": self.created_at.isoformat(),
        }


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "video_id": self.video_id,
            "author": {
                "id": self.author.id,
                "username": self.author.username,
                "avatar_url": self.author.avatar_url,
            },
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # like | comment | follow
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=True)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    actor = db.relationship("User", foreign_keys=[actor_id])
    video = db.relationship("Video", foreign_keys=[video_id])

    def to_dict(self):
        d = {
            "id": self.id,
            "type": self.type,
            "read": self.read,
            "created_at": self.created_at.isoformat(),
            "actor": {
                "id": self.actor.id,
                "username": self.actor.username,
                "avatar_url": self.actor.avatar_url,
            },
        }
        if self.video:
            d["video"] = {
                "id": self.video.id,
                "thumbnail_url": self.video.thumbnail_url,
                "caption": self.video.caption,
            }
        return d
