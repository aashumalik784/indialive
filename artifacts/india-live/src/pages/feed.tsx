import { useAuth } from "@/contexts/AuthContext";
import { useVideos, useLikeVideo } from "@/hooks/use-api";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Feed() {
  const { data, isLoading } = useVideos(1, 10);
  
  if (isLoading) return <div className="h-screen w-full bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mutate: likeVideo } = useLikeVideo();

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

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!video.liked_by_user) {
      likeVideo(video.id);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
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
        className="w-full h-full object-cover"
        onClick={handleTogglePlay}
        onDoubleClick={handleDoubleTap}
      />
      
      {showHeart && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping">
          <Heart className="w-24 h-24 text-primary fill-primary" />
        </div>
      )}

      {/* Overlay Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
        <Link href={`/profile/${video.author.username}`} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden" data-testid={`link-profile-${video.author.username}`}>
          <img src={video.author.avatar_url || "https://ui-avatars.com/api/?name="+video.author.username} alt="" className="w-full h-full object-cover" />
        </Link>
        <button 
          onClick={() => likeVideo(video.id)}
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-like-${video.id}`}
        >
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-95 transition-transform">
            <Heart className={cn("w-6 h-6", video.liked_by_user ? "fill-primary text-primary" : "text-white")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.like_count}</span>
        </button>
        <Link href={`/video/${video.id}`} className="flex flex-col items-center gap-1 group" data-testid={`link-comments-${video.id}`}>
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-95 transition-transform">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.comment_count}</span>
        </Link>
        <button className="flex flex-col items-center gap-1 group" data-testid={`button-share-${video.id}`}>
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-95 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-0">
        <Link href={`/profile/${video.author.username}`} className="text-white font-bold text-lg hover:underline inline-block mb-1 pointer-events-auto" data-testid={`link-profile-name-${video.author.username}`}>
          @{video.author.username}
        </Link>
        <p className="text-white/90 text-sm mb-3 line-clamp-2">{video.caption}</p>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Music2 className="w-4 h-4" />
          <span className="marquee">Original Audio - {video.author.username}</span>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const { currentUser } = useAuth();
  return (
    <div className="fixed bottom-0 w-full h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-50">
      <Link href="/" className="text-white flex flex-col items-center gap-1 opacity-100" data-testid="nav-home">
        <div className="text-xs font-bold">Home</div>
      </Link>
      <Link href="/upload" className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center group active:scale-95 transition-transform" data-testid="nav-upload">
        <div className="w-10 h-6 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black text-xl leading-none font-bold">+</span>
        </div>
      </Link>
      <Link href={currentUser ? `/profile/${currentUser.username}` : "/login"} className="text-white flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity" data-testid="nav-profile">
        <div className="text-xs font-bold">Profile</div>
      </Link>
    </div>
  );
}
