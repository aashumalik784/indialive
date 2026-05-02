import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft, Radio, Users, Video, VideoOff,
  Mic, MicOff, X, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function GoLive() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [connecting, setConnecting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentUser) { setLocation("/login"); return; }
    startCamera();
    return () => stopEverything();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      toast({ title: "Camera access denied", description: "Camera/mic permission required for going live.", variant: "destructive" });
    }
  };

  const stopEverything = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach(p => p.close());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleViewerJoined = useCallback(async ({ viewer_sid }: { viewer_sid: string }) => {
    if (!localStreamRef.current || !socketRef.current || !currentUser) return;
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peersRef.current[viewer_sid] = pc;

    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice_candidate", { candidate: e.candidate, to: viewer_sid });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", {
      offer,
      viewer_sid,
      broadcaster: currentUser.username,
    });
  }, [currentUser]);

  const goLive = async () => {
    if (!localStreamRef.current) {
      toast({ title: "Camera required", description: "Please allow camera access first.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title required", description: "Live ka title likhein.", variant: "destructive" });
      return;
    }
    setConnecting(true);

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const socket = io(baseUrl || window.location.origin, {
      path: "/api/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("go_live", {
        username: currentUser!.username,
        avatar_url: currentUser!.avatar_url || "",
        title: title.trim(),
        started_at: new Date().toISOString(),
      });
      setIsLive(true);
      setConnecting(false);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });

    socket.on("viewer_joined", handleViewerJoined);

    socket.on("answer", async ({ answer, viewer_sid }: { answer: RTCSessionDescriptionInit; viewer_sid: string }) => {
      const pc = peersRef.current[viewer_sid];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice_candidate", async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("viewer_count", ({ count }: { count: number }) => setViewerCount(count));

    socket.on("connect_error", () => {
      setConnecting(false);
      toast({ title: "Connection failed", description: "Server se connect nahi ho saka.", variant: "destructive" });
    });
  };

  const endLive = () => {
    socketRef.current?.emit("end_live", { username: currentUser!.username });
    stopEverything();
    setIsLive(false);
    setDuration(0);
    toast({ title: "Live stream khatam ho gaya!" });
    setLocation("/");
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOn(v => !v); }
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(v => !v); }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-zinc-900 flex items-center px-4 h-14 gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base flex-1">Go Live</h1>
        {isLive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Eye className="w-4 h-4" />
              <span>{viewerCount}</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{fmt(duration)}</span>
          </div>
        )}
      </div>

      {/* Camera preview */}
      <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden" style={{ minHeight: "60vh" }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={cn("w-full h-full object-cover", !isCameraOn && "hidden")}
          style={{ maxHeight: "65vh" }}
        />
        {!isCameraOn && (
          <div className="flex flex-col items-center gap-3 text-zinc-600">
            <VideoOff className="w-16 h-16" />
            <p className="text-sm">Camera band hai</p>
          </div>
        )}

        {/* Live badge on preview */}
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        {isLive && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" />
            {viewerCount} dekh rahe hain
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 bg-black border-t border-zinc-900">
        {!isLive && (
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Live ka title likhein..."
            maxLength={80}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all",
              isCameraOn ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-800 border-red-500/50 text-red-400"
            )}
          >
            {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {isCameraOn ? "Camera On" : "Camera Off"}
          </button>
          <button
            onClick={toggleMic}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all",
              isMicOn ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-800 border-red-500/50 text-red-400"
            )}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {isMicOn ? "Mic On" : "Mic Off"}
          </button>
        </div>

        {!isLive ? (
          <button
            onClick={goLive}
            disabled={connecting || !title.trim()}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
              connecting || !title.trim()
                ? "bg-zinc-800 text-zinc-500"
                : "bg-red-600 text-white shadow-lg shadow-red-600/30 active:scale-95"
            )}
          >
            {connecting ? (
              <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Connect ho raha hai...</>
            ) : (
              <><Radio className="w-5 h-5" /> Live Ho Jaao!</>
            )}
          </button>
        ) : (
          <button
            onClick={endLive}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-red-600/20 border border-red-600 text-red-400 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
            Live Khatam Karein
          </button>
        )}
      </div>
    </div>
  );
}
