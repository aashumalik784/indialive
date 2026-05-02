import { useRoute, useLocation } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { useVideo } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  ArrowLeft, CameraOff, Mic, MicOff,
  Circle, Square, UploadCloud, Loader2, Check,
  FlipHorizontal2, Scissors, Play, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type StitchStep = "clip" | "record" | "preview" | "caption" | "done";

const MAX_CLIP_SEC = 5;
const MIN_CLIP_SEC = 1;

export default function StitchPage() {
  const [, params] = useRoute("/stitch/:videoId");
  const videoId = params?.videoId || "";
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { data: videoData, isLoading } = useVideo(videoId);

  const [step, setStep] = useState<StitchStep>("clip");
  const [clipStart, setClipStart] = useState(0);
  const [clipDuration, setClipDuration] = useState(3);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPhase, setRecordingPhase] = useState<"clip" | "camera">("clip");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [camFacing, setCamFacing] = useState<"user" | "environment">("user");
  const [camError, setCamError] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [clipProgress, setClipProgress] = useState(0);

  const clipVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordingPhaseRef = useRef<"clip" | "camera">("clip");

  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser]);

  useEffect(() => {
    if (step === "record") {
      startCamera();
    }
    return () => {
      if (step === "record") stopCamera();
    };
  }, [step, camFacing, micOn]);

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
    } catch {
      setCamError(true);
    }
  };

  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const clipVid = clipVideoRef.current;
    const camVid = cameraVideoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const phase = recordingPhaseRef.current;

      if (phase === "clip" && clipVid && clipVid.readyState >= 2) {
        // Full-screen clip playback
        const vw = clipVid.videoWidth || W;
        const vh = clipVid.videoHeight || H;
        const scale = Math.max(W / vw, H / vh);
        const sw = vw * scale;
        const sh = vh * scale;
        ctx.drawImage(clipVid, (W - sw) / 2, (H - sh) / 2, sw, sh);

        // "Stitch clip" overlay label
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, W, 44);
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#FF9933";
        ctx.fillText("✂  Stitch Clip", 12, 28);
      } else if (phase === "camera" && camVid && camVid.readyState >= 2) {
        // Full-screen camera
        const cw = camVid.videoWidth || W;
        const ch = camVid.videoHeight || H;
        const scale = Math.max(W / cw, H / ch);
        const sw = cw * scale;
        const sh = ch * scale;

        ctx.save();
        if (camFacing === "user") {
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(camVid, (W - sw) / 2, (H - sh) / 2, sw, sh);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, [camFacing]);

  const startRecording = async () => {
    if (!canvasRef.current || !streamRef.current || !clipVideoRef.current) return;

    // Countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);

    chunksRef.current = [];
    recordingPhaseRef.current = "clip";
    setRecordingPhase("clip");

    const canvasStream = canvasRef.current.captureStream(30);
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
      setStep("preview");
    };

    // Start drawing canvas loop
    drawLoop();

    // Phase 1: Play the clip
    const clipVid = clipVideoRef.current;
    clipVid.currentTime = clipStart;
    clipVid.muted = true;
    clipVid.play().catch(() => {});

    recorder.start(100);
    setIsRecording(true);

    // Wait for clip to finish
    await new Promise<void>(resolve => {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        setClipProgress(Math.min(1, elapsed / (clipDuration * 1000)));
        if (elapsed >= clipDuration * 1000) {
          clearInterval(interval);
          clipVid.pause();
          resolve();
        }
      }, 100);
    });

    // Phase 2: Switch to camera
    recordingPhaseRef.current = "camera";
    setRecordingPhase("camera");
    setClipProgress(0);
  };

  const stopRecording = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    mediaRecorderRef.current?.stop();
    clipVideoRef.current?.pause();
    setIsRecording(false);
  };

  const handleUpload = async () => {
    if (!recordedBlob || !caption.trim()) {
      toast({ title: "Caption zaroori hai", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([recordedBlob], `stitch_${videoId}.${ext}`, { type: recordedBlob.type });
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption);
      formData.append("stitch_of", videoId);

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

  // ── Done ──
  if (step === "done") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold mb-1">Stitch Upload Ho Gaya!</p>
          <p className="text-zinc-400 text-sm">Aapka stitch video feed par dikh raha hai</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setLocation("/")} className="w-full py-3 bg-primary text-black font-bold rounded-2xl">
            Feed Dekho
          </button>
          <button
            onClick={() => { setStep("clip"); setRecordedBlob(null); setPreviewUrl(null); setCaption(""); setClipProgress(0); }}
            className="w-full py-3 border border-zinc-700 text-white font-semibold rounded-2xl"
          >
            Ek Aur Stitch Karein
          </button>
        </div>
      </div>
    );
  }

  // ── Preview + Caption ──
  if (step === "preview" || step === "caption") {
    return (
      <div className="h-screen bg-black text-white flex flex-col">
        <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900">
          <button onClick={() => { setStep("clip"); setPreviewUrl(null); setRecordedBlob(null); }} className="w-8 h-8 flex items-center justify-center text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base flex-1">Stitch Preview</h1>
        </header>

        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {previewUrl && (
            <video
              ref={previewVideoRef}
              src={previewUrl}
              loop autoPlay playsInline muted
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-3">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Apne stitch ka caption likhein... #stitch"
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
              : <><UploadCloud className="w-5 h-5" /> Stitch Post Karein</>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Record ──
  if (step === "record") {
    return (
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        <header className="flex items-center px-4 h-14 z-20 relative">
          <button onClick={() => { stopCamera(); setStep("clip"); }} className="w-8 h-8 flex items-center justify-center text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base mx-auto">Stitch — Apna Jawaab Do</h1>
          <div className="flex gap-2">
            <button onClick={() => setMicOn(m => !m)} className="w-8 h-8 flex items-center justify-center text-zinc-400">
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
            </button>
            <button onClick={() => setCamFacing(f => f === "user" ? "environment" : "user")} className="w-8 h-8 flex items-center justify-center text-zinc-400">
              <FlipHorizontal2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Canvas preview */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video ref={clipVideoRef} src={video.video_url} playsInline muted className="hidden" />
          <video ref={cameraVideoRef} autoPlay playsInline muted className="hidden" />

          {camError ? (
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <CameraOff className="w-12 h-12" />
              <p className="text-sm font-semibold">Camera access nahi mila</p>
              <button onClick={startCamera} className="px-4 py-2 bg-zinc-800 rounded-full text-sm">Dobara Try Karein</button>
            </div>
          ) : (
            <canvas ref={canvasRef} width={720} height={1280} className="w-full h-full object-contain" />
          )}

          {/* Phase indicator bar */}
          {isRecording && (
            <div className="absolute top-3 left-4 right-4 z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", recordingPhase === "clip" ? "bg-primary animate-pulse" : "bg-red-500 animate-pulse")} />
                <span className="text-white text-xs font-bold">
                  {recordingPhase === "clip" ? `Clip chal rahi hai (${clipDuration}s)` : "Aapka response — REC"}
                </span>
              </div>
              {recordingPhase === "clip" && (
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${clipProgress * 100}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Countdown */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <span className="text-white text-8xl font-black">{countdown}</span>
            </div>
          )}
        </div>

        {/* Original clip info strip */}
        <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-900 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-zinc-400 text-xs truncate flex-1">
            <span className="text-white font-semibold">@{video.author.username}</span> ke video se {clipStart.toFixed(1)}s – {(clipStart + clipDuration).toFixed(1)}s stitch
          </p>
        </div>

        {/* Record button */}
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
          {isRecording
            ? recordingPhase === "clip"
              ? "Pehle clip chalegi, phir aapka camera shuru hoga..."
              : "Apna response do — band karo jab ho jaaye"
            : "Shuru karein — pehle clip chalegi, phir aapka camera on hoga"}
        </p>
      </div>
    );
  }

  // ── Clip Select ──
  const maxStart = Math.max(0, videoDuration - MIN_CLIP_SEC);
  const maxClipDur = Math.min(MAX_CLIP_SEC, videoDuration - clipStart);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900">
        <Link href={`/video/${videoId}`} className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-base">Stitch</h1>
          <p className="text-zinc-500 text-xs">Clip chunein (max {MAX_CLIP_SEC}s)</p>
        </div>
        <button
          onClick={() => setStep("record")}
          className="flex items-center gap-1.5 bg-primary text-black font-bold text-sm px-4 py-2 rounded-full"
        >
          Aage <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      {/* Video preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={clipVideoRef}
          src={video.video_url}
          playsInline
          muted
          className="w-full h-full object-contain"
          onLoadedMetadata={e => {
            const dur = (e.target as HTMLVideoElement).duration;
            setVideoDuration(dur);
            setClipDuration(Math.min(MAX_CLIP_SEC, dur));
          }}
          onTimeUpdate={e => {
            const t = e.currentTarget;
            if (t.currentTime >= clipStart + clipDuration) {
              t.currentTime = clipStart;
            }
          }}
          onCanPlay={e => {
            const t = e.currentTarget as HTMLVideoElement;
            t.currentTime = clipStart;
            t.play().catch(() => {});
          }}
        />

        {/* Clip overlay showing selected range */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-2xl p-3 backdrop-blur-sm">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Start: {clipStart.toFixed(1)}s</span>
            <span className="text-primary font-bold">{clipDuration.toFixed(1)}s chunai</span>
            <span>End: {(clipStart + clipDuration).toFixed(1)}s</span>
          </div>
          {/* Progress bar showing clip in video */}
          <div className="relative w-full h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
            <div
              className="absolute h-full bg-primary/40 rounded-full"
              style={{
                left: `${videoDuration ? (clipStart / videoDuration) * 100 : 0}%`,
                width: `${videoDuration ? (clipDuration / videoDuration) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Clip start slider */}
          <label className="text-xs text-zinc-400 mb-1 block">Clip start:</label>
          <input
            type="range"
            min={0}
            max={maxStart}
            step={0.1}
            value={clipStart}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setClipStart(val);
              if (clipVideoRef.current) {
                clipVideoRef.current.currentTime = val;
              }
            }}
            className="w-full accent-primary mb-2"
          />

          {/* Clip duration slider */}
          <label className="text-xs text-zinc-400 mb-1 block">Clip length: {clipDuration.toFixed(1)}s</label>
          <input
            type="range"
            min={MIN_CLIP_SEC}
            max={maxClipDur || MAX_CLIP_SEC}
            step={0.1}
            value={clipDuration}
            onChange={e => setClipDuration(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Author info */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
          <img
            src={video.author.avatar_url || `https://ui-avatars.com/api/?name=${video.author.username}&background=FF9933&color=000`}
            alt=""
            className="w-5 h-5 rounded-full border border-zinc-600"
          />
          <span className="text-white text-xs font-semibold">@{video.author.username}</span>
        </div>
      </div>
    </div>
  );
}
