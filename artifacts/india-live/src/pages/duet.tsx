import { useRoute, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useVideo } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  ArrowLeft, Camera, CameraOff, Mic, MicOff,
  Circle, Square, UploadCloud, Loader2, Check,
  FlipHorizontal2
} from "lucide-react";
import { cn } from "@/lib/utils";

type DuetStep = "record" | "preview" | "upload" | "done";

export default function DuetPage() {
  const [, params] = useRoute("/duet/:videoId");
  const videoId = params?.videoId || "";
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { data: videoData, isLoading } = useVideo(videoId);

  const [step, setStep] = useState<DuetStep>("record");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [camFacing, setCamFacing] = useState<"user" | "environment">("user");
  const [camError, setCamError] = useState(false);
  const [micOn, setMicOn] = useState(true);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [camFacing, micOn]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const startCamera = async () => {
    stopCamera();
    setCamError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: camFacing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: micOn,
      });
      streamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => {});
      }
      drawCanvas();
    } catch {
      setCamError(true);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const orig = originalVideoRef.current;
    const cam = cameraVideoRef.current;
    if (!canvas || !orig || !cam) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const half = W / 2;

    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Original video on LEFT
      if (orig.readyState >= 2) {
        const ow = orig.videoWidth || half;
        const oh = orig.videoHeight || H;
        const scale = Math.max(half / ow, H / oh);
        const sw = ow * scale;
        const sh = oh * scale;
        ctx.drawImage(orig, (half - sw) / 2, (H - sh) / 2, sw, sh);
      }

      // Camera on RIGHT — mirror for front cam
      if (cam.readyState >= 2) {
        const cw = cam.videoWidth || half;
        const ch = cam.videoHeight || H;
        const scale = Math.max(half / cw, H / ch);
        const sw = cw * scale;
        const sh = ch * scale;

        ctx.save();
        ctx.translate(half, 0);
        if (camFacing === "user") {
          ctx.translate(half, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(cam, (half - sw) / 2, (H - sh) / 2, sw, sh);
        } else {
          ctx.drawImage(cam, (half - sw) / 2, (H - sh) / 2, sw, sh);
        }
        ctx.restore();
      }

      // Divider line
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(half, 0);
      ctx.lineTo(half, H);
      ctx.stroke();

      // Labels
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Original", 10, 24);
      ctx.fillText("Aapka", half + 10, 24);

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const startRecording = async () => {
    if (!canvasRef.current || !streamRef.current) return;

    // 3-2-1 countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);

    // Play original video from start
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = 0;
      originalVideoRef.current.play().catch(() => {});
    }

    chunksRef.current = [];
    const canvasStream = canvasRef.current.captureStream(30);

    // Add audio from mic
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(t => canvasStream.addTrack(t));

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(canvasStream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      originalVideoRef.current?.pause();
      setStep("preview");
    };

    recorder.start(100);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleUpload = async () => {
    if (!recordedBlob || !caption.trim()) {
      toast({ title: "Caption zaroori hai", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setStep("upload");
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([recordedBlob], `duet_${videoId}.${ext}`, { type: recordedBlob.type });
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption);
      formData.append("duet_of", videoId);

      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/videos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      setStep("done");
    } catch (err: any) {
      toast({ title: "Upload nahi ho saka", description: err.message, variant: "destructive" });
      setStep("preview");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const video = videoData?.video;
  if (!video) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Video nahi mili</p>
        <Link href="/" className="text-primary font-semibold">Home par jaao</Link>
      </div>
    );
  }

  // Done state
  if (step === "done") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white mb-1">Duet Upload Ho Gaya!</p>
          <p className="text-zinc-400 text-sm">Aapka duet video feed par dikh raha hai</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setLocation("/")} className="w-full py-3 bg-primary text-black font-bold rounded-2xl">
            Feed Dekho
          </button>
          <button onClick={() => { setStep("record"); setRecordedBlob(null); setPreviewUrl(null); setCaption(""); }}
            className="w-full py-3 border border-zinc-700 text-white font-semibold rounded-2xl">
            Ek Aur Duet Karein
          </button>
        </div>
      </div>
    );
  }

  // Preview + caption state
  if (step === "preview" || step === "upload") {
    return (
      <div className="h-screen bg-black text-white flex flex-col">
        <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900">
          <button onClick={() => setStep("record")} className="w-8 h-8 flex items-center justify-center text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base flex-1">Duet Preview</h1>
        </header>

        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {previewUrl && (
            <video
              ref={previewVideoRef}
              src={previewUrl}
              loop
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-3">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Apne duet ka caption likhein... #duet"
            maxLength={300}
            rows={2}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleUpload}
            disabled={isUploading || !caption.trim()}
            className="w-full py-3.5 bg-primary text-black font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Upload ho raha hai...</>
              : <><UploadCloud className="w-5 h-5" /> Duet Post Karein</>
            }
          </button>
        </div>
      </div>
    );
  }

  // Main recording state
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 h-14 z-20 relative">
        <Link href={`/video/${videoId}`} className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base mx-auto">Duet</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMicOn(m => !m)}
            className="w-8 h-8 flex items-center justify-center text-zinc-400"
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </button>
          <button
            onClick={() => setCamFacing(f => f === "user" ? "environment" : "user")}
            className="w-8 h-8 flex items-center justify-center text-zinc-400"
          >
            <FlipHorizontal2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Canvas Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {/* Hidden elements for compositing */}
        <video
          ref={originalVideoRef}
          src={video.video_url}
          loop
          playsInline
          muted
          className="hidden"
          onCanPlay={() => drawCanvas()}
        />
        <video ref={cameraVideoRef} autoPlay playsInline muted className="hidden" />

        {camError ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <CameraOff className="w-12 h-12" />
            <p className="text-sm font-semibold">Camera access nahi mila</p>
            <button onClick={startCamera} className="px-4 py-2 bg-zinc-800 rounded-full text-sm">
              Dobara Try Karein
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            className="w-full h-full object-contain"
          />
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-white text-8xl font-black">{countdown}</span>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-bold">Recording</span>
          </div>
        )}
      </div>

      {/* Original video info strip */}
      <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-900 flex items-center gap-2">
        <img
          src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
          alt=""
          className="w-6 h-6 rounded-full border border-zinc-700 flex-shrink-0"
        />
        <p className="text-zinc-400 text-xs truncate flex-1">
          <span className="text-white font-semibold">@{video.author.username}</span> ke video ke saath duet
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 py-6 bg-black">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={camError || countdown !== null}
            className="w-20 h-20 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <Circle className="w-10 h-10 fill-primary text-primary" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full border-4 border-red-500 bg-red-500/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Square className="w-8 h-8 fill-red-500 text-red-500" />
          </button>
        )}
      </div>

      <p className="text-center text-zinc-600 text-xs pb-4">
        {isRecording ? "Ruk jaao button dabao recording rok ne ke liye" : "Button dabao recording shuru karne ke liye"}
      </p>
    </div>
  );
}
