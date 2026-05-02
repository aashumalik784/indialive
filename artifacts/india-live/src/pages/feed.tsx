import { useAuth } from "@/contexts/AuthContext";
import { useVideos, useFollowingFeed, useLikeVideo } from "@/hooks/use-api";
import { Link } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heart, MessageCircle, Share2, Music2,
  Play, Pause, Search, User2, Home,
  RefreshCw, VideoOff, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ShareSheet from "@/components/ShareSheet";

interface LiveStream {
  username: string;
  avatar_url: string;
  viewer_count: number;
  title: string;
}

function LiveBar() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const baseUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchStreams = () => {
      fetch(`${baseUrl}/api/live/streams`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.streams) setStreams(d.streams); })
        .catch(() => {});
    };
    fetchStreams();
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  if (streams.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-900 px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 text-red-500 flex-shrink-0 mr-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold">LIVE</span>
        </div>
        {streams.map((stream) => (
          <Link
            key={stream.username}
            href={`/live/${stream.username}`}
            className="flex items-center gap-1.5 bg-zinc-900 border border-red-500/30 rounded-full pl-0.5 pr-3 py-0.5 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-red-500">
                <img
                  src={stream.avatar_url || `https://ui-avatars.com/api/?name=${stream.username}&background=FF9933&color=000`}
                  alt={stream.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-black flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <span className="text-white text-xs font-semibold">{stream.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const { currentUser } = useAuth();

  const forYou = useVideos(1, 10);
  const following = useFollowingFeed(1, 10);

  const active = activeTab === "foryou" ? forYou : following;
  const { isLoading, isError, refetch } = active;
  const videos = active.data?.videos ?? [];

  if (isLoading) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (isError) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4 text-white">
      <RefreshCw className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-400">Videos load nahi ho sakin</p>
      <button onClick={() => refetch()} className="px-6 py-2 bg-primary text-black font-bold rounded-full text-sm">
        Dobara Try Karein
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-black snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
      <LiveBar />

      {/* For You / Following tabs */}
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-center items-center gap-6 pt-3 pb-2 pointer-events-none">
        <div className="flex gap-6 bg-black/30 backdrop-blur-md rounded-full px-5 py-1.5 pointer-events-auto border border-white/10">
          <button
            onClick={() => setActiveTab("foryou")}
            className={cn(
              "text-sm font-bold transition-all",
              activeTab === "foryou" ? "text-white" : "text-white/40"
            )}
          >
            For You
          </button>
          <button
            onClick={() => {
              if (!currentUser) return;
              setActiveTab("following");
            }}
            className={cn(
              "text-sm font-bold transition-all",
              activeTab === "following" ? "text-white" : "text-white/40",
              !currentUser && "opacity-40 cursor-not-allowed"
            )}
          >
            Following
          </button>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="h-[100dvh] snap-start flex flex-col items-center justify-center gap-4 text-white px-6 pb-20">
          <VideoOff className="w-12 h-12 text-zinc-700" />
          {activeTab === "following" ? (
            <>
              <p className="text-zinc-400 font-semibold text-center">Aapne abhi kisi ko follow nahi kiya</p>
              <p className="text-zinc-600 text-sm text-center">Creators ko follow karein unki videos yahan dikhne ke liye</p>
              <Link href="/search" className="px-6 py-2 bg-primary text-black font-bold rounded-full text-sm mt-2">
                Creators Dhundein
              </Link>
            </>
          ) : (
            <>
              <p className="text-zinc-500 font-semibold">Abhi koi video nahi hai</p>
              <Link href="/upload" className="px-6 py-2 bg-primary text-black font-bold rounded-full text-sm">
                Pehla Video Upload Karein
              </Link>
            </>
          )}
        </div>
      ) : (
        videos.map((video) => <VideoCard key={video.id} video={video} />)
      )}

      <BottomNav />
    </div>
  );
}

function VideoCard({ video }: { video: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [iconFading, setIconFading] = useState(false);
  const [showShare, setShowShare] = useState(false);
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

  const shareUrl = `${window.location.origin}/video/${video.id}`;

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

      {/* Double-tap heart */}
      {showHeart && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none">
          <Heart className="w-24 h-24 text-red-500 fill-red-500" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {showPlayIcon && (
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300",
          iconFading ? "opacity-0" : "opacity-100"
        )}>
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            {isPlaying
              ? <Pause className="w-10 h-10 text-white fill-white" />
              : <Play className="w-10 h-10 text-white fill-white ml-1" />
            }
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center z-10">
        <Link href={`/profile/${video.author.username}`} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
            <img
              src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
              alt={video.author.username}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <button onClick={() => likeVideo(String(video.id))} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Heart className={cn("w-7 h-7 transition-colors", video.liked_by_user ? "fill-red-500 text-red-500" : "text-white")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.like_count}</span>
        </button>

        <Link href={`/video/${video.id}`} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.comment_count}</span>
        </Link>

        <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>
      </div>

      <ShareSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        url={shareUrl}
        caption={video.caption}
      />

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-0">
        <Link href={`/profile/${video.author.username}`} className="flex items-center gap-2 mb-2 pointer-events-auto w-fit">
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
      <Link href={currentUser ? `/go-live` : "/login"} className="flex flex-col items-center gap-0.5 text-red-500 hover:text-red-400 transition-colors" data-testid="nav-live">
        <Radio className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Live</span>
      </Link>
      <Link href={currentUser ? `/profile/${currentUser.username}` : "/login"} className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white transition-colors" data-testid="nav-profile">
        <User2 className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Profile</span>
      </Link>
    </div>
  );
}
