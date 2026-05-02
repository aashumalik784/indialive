import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Users, Heart, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function LiveWatch() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const [streamTitle, setStreamTitle] = useState("Live Stream");

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const socket = io(baseUrl || window.location.origin, {
      path: "/api/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("watch_live", { broadcaster: username });
    });

    socket.on("offer", async ({ offer, broadcaster }: { offer: RTCSessionDescriptionInit; broadcaster: string }) => {
      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice_candidate", { candidate: e.candidate, to: socket.id });
          socket.emit("ice_candidate", { candidate: e.candidate, to: "broadcaster" });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer, broadcaster });
    });

    socket.on("ice_candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("viewer_count", ({ count }: { count: number }) => setViewerCount(count));

    socket.on("live_ended", () => {
      setIsEnded(true);
      setIsConnected(false);
    });

    socket.on("error", () => {
      setIsEnded(true);
    });

    return () => {
      socket.emit("leave_live", { broadcaster: username });
      socket.disconnect();
      pcRef.current?.close();
    };
  }, [username]);

  const sendHeart = () => {
    const id = Date.now();
    setHearts(h => [...h, id]);
    setTimeout(() => setHearts(h => h.filter(x => x !== id)), 2000);
  };

  if (isEnded) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
      <WifiOff className="w-16 h-16 text-zinc-600" />
      <p className="text-xl font-bold">Live Stream Khatam Ho Gayi</p>
      <p className="text-zinc-500 text-sm">@{username} ne live band kar diya</p>
      <Link href="/" className="px-6 py-2 bg-primary text-black font-bold rounded-full text-sm mt-2">
        Feed Par Jaao
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col text-white relative overflow-hidden">
      {/* Remote video fullscreen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center px-4 pt-4 pb-2 gap-3">
        <Link href="/" className="w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5">
          <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden">
            <img
              src={`https://ui-avatars.com/api/?name=${username}&background=FF9933&color=000`}
              alt={username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white text-sm font-bold">@{username}</span>
          <div className="flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold">LIVE</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-black/50 backdrop-blur rounded-full px-3 py-1.5 text-sm text-white">
          <Users className="w-4 h-4" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* Connecting indicator */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
            <p className="text-white text-sm">Live se connect ho raha hai...</p>
          </div>
        </div>
      )}

      {/* Floating hearts */}
      <div className="absolute bottom-32 right-4 pointer-events-none z-20">
        {hearts.map(id => (
          <div
            key={id}
            className="absolute bottom-0 right-0 text-2xl animate-bounce"
            style={{ animation: "floatUp 2s ease-out forwards" }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 z-10">
        <div className="flex-1 bg-black/40 backdrop-blur-md rounded-full px-4 py-2.5 text-zinc-400 text-sm">
          {streamTitle}
        </div>
        <button
          onClick={sendHeart}
          className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center text-red-400 active:scale-90 transition-transform"
        >
          <Heart className="w-6 h-6 fill-red-400" />
        </button>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
