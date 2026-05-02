import { useAuth } from "@/contexts/AuthContext";
import { useVideos, useLikeVideo } from "@/hooks/use-api";
import { Link } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Music2, Play, Pause, Search, User2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Feed() {
  const { data, isLoading } = useVideos(1, 10);
  
  if (isLoading) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-black snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
      {data?.videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
      <BottomNav />
    </div>
  );
}

function VideoCard({ video }: { video: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [iconFading, setIconFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: likeVideo } = useLikeVideo();
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const showIconBriefly = useCallback(() => {
    setIconFading(false);
    setShowPlayIcon(true);
    if (iconTimerRef.current) clearTimeout(iconTimerRef.current);
    iconTimerRef.current = setTimeout(() => {
      setIconFading(true);
      iconTimerRef.current = setTimeout(() => setShowPlayIcon(false), 300);
    }, 800);
  }, []);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      showIconBriefly();
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.liked_by_user) {
      likeVideo(String(video.id));
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/video/${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Video link copied to clipboard" });
      }
    } catch {}
  };

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden"
    >
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url}
        loop
        playsInline
        muted
        className="w-full h-full object-cover"
        onClick={handleTogglePlay}
        onDoubleClick={handleDoubleTap}
      />
      
      {/* Double-tap heart animation */}
      {showHeart && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none">
          <Heart className="w-24 h-24 text-primary fill-primary" />
        </div>
      )}

      {/* Play/Pause icon overlay */}
      {showPlayIcon && (
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300",
            iconFading ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            {isPlaying
              ? <Pause className="w-10 h-10 text-white fill-white" />
              : <Play className="w-10 h-10 text-white fill-white ml-1" />
            }
          </div>
        </div>
      )}

      {/* Right side action buttons */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center z-10">
        {/* Creator avatar */}
        <Link href={`/profile/${video.author.username}`} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
            <img
              src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
              alt={video.author.username}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Like button */}
        <button 
          onClick={() => likeVideo(String(video.id))}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Heart
              className={cn(
                "w-7 h-7 transition-colors",
                video.liked_by_user ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.like_count}</span>
        </button>

        {/* Comments button */}
        <Link href={`/video/${video.id}`} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.comment_count}</span>
        </Link>

        {/* Share button */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-0">
        <Link
          href={`/profile/${video.author.username}`}
          className="flex items-center gap-2 mb-2 pointer-events-auto w-fit"
        >
          <div className="w-8 h-8 rounded-full border border-primary overflow-hidden flex-shrink-0">
            <img
              src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
              alt={video.author.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-bold text-base drop-shadow-lg">@{video.author.username}</span>
        </Link>
        <p className="text-white/90 text-sm mb-2 line-clamp-2">{video.caption}</p>
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Original Audio · {video.author.username}</span>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const { currentUser } = useAuth();
  return (
    <div className="fixed bottom-0 w-full h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-50">
      <Link href="/" className="flex flex-col items-center gap-0.5 text-primary" data-testid="nav-home">
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold">Home</span>
      </Link>
      <Link href="/search" className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white transition-colors" data-testid="nav-search">
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Search</span>
      </Link>
      <Link href="/upload" className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center active:scale-95 transition-transform" data-testid="nav-upload">
        <div className="w-10 h-6 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black text-xl leading-none font-bold">+</span>
        </div>
      </Link>
      <Link href={currentUser ? `/profile/${currentUser.username}` : "/login"} className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white transition-colors" data-testid="nav-profile">
        <User2 className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Profile</span>
      </Link>
    </div>
  );
}
