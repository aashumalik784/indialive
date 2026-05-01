from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    videos = db.relationship("Video", backref="author", lazy=True, cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="user", lazy=True, cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="author", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "created_at": self.created_at.isoformat(),
            "video_count": len(self.videos),
        }


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
