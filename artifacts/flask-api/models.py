from datetime import datetime, timezone, timedelta
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

    videos = db.relationship("Video", foreign_keys="Video.user_id", backref="author", lazy=True, cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="user", lazy=True, cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="author", lazy=True, cascade="all, delete-orphan")
    following = db.relationship("Follow", foreign_keys="Follow.follower_id", backref="follower", lazy="dynamic", cascade="all, delete-orphan")
    followers = db.relationship("Follow", foreign_keys="Follow.following_id", backref="following_user", lazy="dynamic", cascade="all, delete-orphan")
    stories = db.relationship("Story", backref="author", lazy=True, cascade="all, delete-orphan")
    bookmarks = db.relationship("Bookmark", backref="user", lazy=True, cascade="all, delete-orphan")

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
            data["is_following"] = current_user.is_following(self)
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
    stitch_of = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=True)
    sound_of = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=True)
    privacy = db.Column(db.String(20), default="public")
    pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    likes = db.relationship("Like", backref="video", lazy=True, cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="video", lazy=True, cascade="all, delete-orphan")
    bookmarks = db.relationship("Bookmark", backref="video", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        liked_by_user = False
        bookmarked_by_user = False
        if current_user_id:
            liked_by_user = any(like.user_id == current_user_id for like in self.likes)
            bookmarked_by_user = any(bm.user_id == current_user_id for bm in self.bookmarks)
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
            "bookmarked_by_user": bookmarked_by_user,
            "duet_of": self.duet_of,
            "stitch_of": self.stitch_of,
            "sound_of": self.sound_of,
            "privacy": self.privacy,
            "pinned": self.pinned,
            "created_at": self.created_at.isoformat(),
        }


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "video_id", name="unique_user_video_like"),)


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    reply_to = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    likes = db.relationship("CommentLike", backref="comment", lazy=True, cascade="all, delete-orphan")
    replies = db.relationship("Comment", foreign_keys="Comment.reply_to", lazy=True)

    def to_dict(self, current_user_id=None):
        liked = False
        if current_user_id:
            liked = any(cl.user_id == current_user_id for cl in self.likes)
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
            "reply_to": self.reply_to,
            "like_count": len(self.likes),
            "liked_by_user": liked,
            "reply_count": len(self.replies),
            "created_at": self.created_at.isoformat(),
        }


class CommentLike(db.Model):
    __tablename__ = "comment_likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "comment_id", name="unique_comment_like"),)


class Bookmark(db.Model):
    __tablename__ = "bookmarks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey("videos.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "video_id", name="unique_bookmark"),)


class Story(db.Model):
    __tablename__ = "stories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    media_url = db.Column(db.String(500), nullable=False)
    media_type = db.Column(db.String(20), default="image")
    caption = db.Column(db.String(300), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "author": {
                "id": self.author.id,
                "username": self.author.username,
                "avatar_url": self.author.avatar_url,
            },
            "media_url": self.media_url,
            "media_type": self.media_type,
            "caption": self.caption,
            "expires_at": self.expires_at.isoformat(),
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat(),
        }


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.String(1000), nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    sender = db.relationship("User", foreign_keys=[sender_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "sender": {
                "id": self.sender.id,
                "username": self.sender.username,
                "avatar_url": self.sender.avatar_url,
            },
            "content": self.content,
            "read": self.read,
            "created_at": self.created_at.isoformat(),
        }


class Block(db.Model):
    __tablename__ = "blocks"

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    blocked_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("blocker_id", "blocked_id", name="unique_block"),)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)
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
