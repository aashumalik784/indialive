import { useAuth } from "@/contexts/AuthContext";
import { useVideos, useFollowingFeed, useLikeVideo } from "@/hooks/use-api";
import { Link } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heart, MessageCircle, Share2, Music2,
  Play, Pause, RefreshCw, VideoOff, Download, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ShareSheet from "@/components/ShareSheet";
import BottomNav from "@/components/BottomNav";

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

function ExitDialog({ onStay, onExit }: { onStay: () => void; onExit: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl p-6 pb-10 space-y-3">
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
        <p className="text-white font-bold text-center text-lg">App band karna chahte hain?</p>
        <p className="text-zinc-500 text-sm text-center">India Live se bahar jaana chahte hain?</p>
        <div className="pt-2 space-y-2">
          <button
            onClick={onExit}
            className="w-full py-3.5 bg-red-600 text-white font-bold rounded-2xl text-base"
          >
            Haan, Band Karein
          </button>
          <button
            onClick={onStay}
            className="w-full py-3.5 bg-zinc-800 text-white font-semibold rounded-2xl text-base"
          >
            Ruko, Wapas Jaao
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const exitDialogRef = useRef(false);
  const { currentUser } = useAuth();

  const forYou = useVideos(1, 10);
  const following = useFollowingFeed(1, 10);

  const active = activeTab === "foryou" ? forYou : following;
  const { isLoading, isError, refetch } = active;
  const videos = active.data?.videos ?? [];

  // Exit dialog — back button intercept
  useEffect(() => {
    history.pushState({ indialive: true }, "", window.location.href);

    const handlePopState = () => {
      if (!exitDialogRef.current) {
        exitDialogRef.current = true;
        setShowExitDialog(true);
        history.pushState({ indialive: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleStay = () => {
    exitDialogRef.current = false;
    setShowExitDialog(false);
  };

  const handleExit = () => {
    window.close();
    setTimeout(() => { window.location.href = "about:blank"; }, 150);
  };

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
        videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            soundUnlocked={soundUnlocked}
            onUnlockSound={() => setSoundUnlocked(true)}
          />
        ))
      )}

      <BottomNav active="home" />

      {showExitDialog && (
        <ExitDialog onStay={handleStay} onExit={handleExit} />
      )}
    </div>
  );
}

function VideoCard({
  video,
  soundUnlocked,
  onUnlockSound,
}: {
  video: any;
  soundUnlocked: boolean;
  onUnlockSound: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [iconFading, setIconFading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSoundHint, setShowSoundHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);
  const { mutate: likeVideo } = useLikeVideo();
  const { toast } = useToast();

  // When global sound is unlocked, unmute this video if it's visible
  useEffect(() => {
    if (soundUnlocked && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  }, [soundUnlocked]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisibleRef.current = true;
            if (videoRef.current) {
              videoRef.current.muted = !soundUnlocked;
              setIsMuted(!soundUnlocked);
              const playPromise = videoRef.current.play();
              if (playPromise) {
                playPromise.catch(() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    setIsMuted(true);
                    videoRef.current.play().catch(() => {});
                  }
                });
              }
            }
            setIsPlaying(true);
            // Show sound hint only for first video if sound not unlocked
            if (!soundUnlocked) {
              setShowSoundHint(true);
            }
          } else {
            isVisibleRef.current = false;
            videoRef.current?.pause();
            setIsPlaying(false);
            setShowSoundHint(false);
          }
        });
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [soundUnlocked]);

  const showIconBriefly = useCallback(() => {
    setIconFading(false);
    setShowPlayIcon(true);
    if (iconTimerRef.current) clearTimeout(iconTimerRef.current);
    iconTimerRef.current = setTimeout(() => {
      setIconFading(true);
      iconTimerRef.current = setTimeout(() => setShowPlayIcon(false), 300);
    }, 800);
  }, []);

  const handleTap = () => {
    // First tap ever — unlock sound
    if (!soundUnlocked && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setShowSoundHint(false);
      onUnlockSound();
      // Don't toggle play on first sound-unlock tap
      return;
    }

    // Normal tap — toggle play/pause
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    toast({ title: "Download shuru ho raha hai..." });
    try {
      const res = await fetch(video.video_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `indialive_${video.author.username}_${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast({ title: "Video save ho gaya!" });
    } catch {
      toast({ title: "Download nahi ho saka", description: "Dobara try karein", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
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
        onClick={handleTap}
        onDoubleClick={handleDoubleTap}
      />

      {/* Sound unlock hint — shown on first video before any tap */}
      {showSoundHint && !soundUnlocked && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-pulse"
        >
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-5 py-3 border border-white/20">
            <Volume2 className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-semibold">Awaaz ke liye tap karein</span>
          </div>
        </div>
      )}

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

        <button onClick={(e) => { e.stopPropagation(); likeVideo(String(video.id)); }} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Heart className={cn("w-7 h-7 transition-colors", video.liked_by_user ? "fill-red-500 text-red-500" : "text-white")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.like_count}</span>
        </button>

        <Link href={`/video/${video.id}`} className="flex flex-col items-center gap-1 group" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.comment_count}</span>
        </Link>

        <button onClick={(e) => { e.stopPropagation(); setShowShare(true); }} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>

        <button onClick={handleDownload} disabled={isDownloading} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
            {isDownloading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Download className="w-6 h-6 text-white" />
            }
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Save</span>
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
        <Link href={`/profile/${video.author.username}`} className="flex items-center gap-2 mb-2 pointer-events-auto w-fit" onClick={e => e.stopPropagation()}>
          <div className="w-8 h-8 rounded-full border border-primary overflow-hidden flex-shrink-0">
            <img
              src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
              alt={video.author.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-bold text-base drop-shadow-lg">@{video.author.username}</span>
        </Link>
        <p className="text-white/90 text-sm mb-2 line-clamp-2 pointer-events-auto">
          {video.caption.split(/(\s+)/).map((word: string, i: number) =>
            word.startsWith("#") ? (
              <Link key={i} href={`/hashtag/${word.slice(1)}`} className="text-primary font-semibold" onClick={e => e.stopPropagation()}>
                {word}
              </Link>
            ) : word
          )}
        </p>
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Original Audio · {video.author.username}</span>
        </div>
      </div>
    </div>
  );
}
