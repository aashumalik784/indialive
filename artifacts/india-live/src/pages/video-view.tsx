import { useRoute } from "wouter";
import { useVideo, useComments, useAddComment, useLikeVideo } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { ArrowLeft, Heart, MessageCircle, Share2, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VideoView() {
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id || "";
  const { data: videoData, isLoading: videoLoading } = useVideo(videoId);
  const { data: commentsData, isLoading: commentsLoading } = useComments(videoId);
  const { mutate: likeVideo } = useLikeVideo();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { currentUser } = useAuth();
  
  const [commentText, setCommentText] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [videoData]);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({ videoId, content: commentText.trim() }, {
      onSuccess: () => setCommentText("")
    });
  };

  if (videoLoading) {
    return <div className="h-screen w-full bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!videoData?.video) {
    return <div className="h-screen w-full bg-black text-white flex items-center justify-center flex-col gap-4"><h1>Video not found</h1><Link href="/" className="text-primary hover:underline">Go Home</Link></div>;
  }

  const video = videoData.video;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col md:flex-row">
      {/* Video Section */}
      <div className="w-full md:w-[60%] lg:w-[70%] h-[60vh] md:h-screen relative bg-black flex items-center justify-center border-r border-zinc-900">
        <Link href="/" className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70" data-testid="link-back">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url}
          loop
          playsInline
          className="w-full h-full object-contain"
          onClick={handleTogglePlay}
        />
        
        {/* Actions Overlay */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10 md:hidden">
          <Link href={`/profile/${video.author.username}`} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden" data-testid="link-profile-mobile">
            <img src={video.author.avatar_url || "https://ui-avatars.com/api/?name="+video.author.username} alt="" className="w-full h-full object-cover" />
          </Link>
          <button 
            onClick={() => likeVideo(video.id)}
            className="flex flex-col items-center gap-1 group"
            data-testid="button-like-mobile"
          >
            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
              <Heart className={cn("w-6 h-6", video.liked_by_user ? "fill-primary text-primary" : "text-white")} />
            </div>
            <span className="text-white text-xs font-semibold">{video.like_count}</span>
          </button>
        </div>
      </div>

      {/* Comments & Info Section */}
      <div className="flex-1 flex flex-col h-[40vh] md:h-screen bg-zinc-950 text-white">
        {/* Author Info */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${video.author.username}`} data-testid="link-profile">
              <img src={video.author.avatar_url || "https://ui-avatars.com/api/?name="+video.author.username} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-800" />
            </Link>
            <div>
              <Link href={`/profile/${video.author.username}`} className="font-bold hover:underline" data-testid="link-profile-name">
                {video.author.username}
              </Link>
              <div className="text-zinc-400 text-xs">{formatDistanceToNow(new Date(video.created_at))} ago</div>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
            <button 
              onClick={() => likeVideo(video.id)}
              className="flex items-center gap-2 text-zinc-300 hover:text-white"
              data-testid="button-like"
            >
              <Heart className={cn("w-6 h-6", video.liked_by_user ? "fill-primary text-primary" : "")} />
              <span className="font-semibold">{video.like_count}</span>
            </button>
            <button
              className="flex items-center gap-2 text-zinc-300 hover:text-white"
              data-testid="button-share"
              onClick={async () => {
                const url = window.location.href;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: video.caption, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                  }
                } catch {}
              }}
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Caption */}
        <div className="p-4 text-sm whitespace-pre-wrap text-zinc-200 border-b border-zinc-900">
          {video.caption}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {commentsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : commentsData?.comments?.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-sm">No comments yet. Be the first to comment!</div>
          ) : (
            commentsData?.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/profile/${comment.author.username}`}>
                  <img src={comment.author.avatar_url || "https://ui-avatars.com/api/?name="+comment.author.username} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                </Link>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${comment.author.username}`} className="font-semibold text-sm hover:underline text-zinc-300">
                      {comment.author.username}
                    </Link>
                    <span className="text-xs text-zinc-600">{formatDistanceToNow(new Date(comment.created_at))}</span>
                  </div>
                  <p className="text-sm mt-0.5 text-zinc-100 break-words">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex items-center gap-3">
              <img src={currentUser.avatar_url || "https://ui-avatars.com/api/?name="+currentUser.username} alt="" className="w-8 h-8 rounded-full object-cover hidden sm:block" />
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="bg-zinc-900 border-zinc-800 text-white rounded-full flex-1 focus-visible:ring-primary"
                data-testid="input-comment"
              />
              <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 text-black flex-shrink-0" disabled={!commentText.trim() || isAddingComment} data-testid="button-submit-comment">
                {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </Button>
            </form>
          ) : (
            <div className="text-center py-2 text-sm text-zinc-400">
              Please <Link href="/login" className="text-primary hover:underline font-semibold">log in</Link> to comment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
