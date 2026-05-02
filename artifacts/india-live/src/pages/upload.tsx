import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Video, X, CheckCircle2,
  Hash, Loader2, ChevronRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const HASHTAG_SUGGESTIONS = [
  "#trending", "#viral", "#india", "#indialive",
  "#reels", "#funny", "#dance", "#music",
  "#desi", "#bollywood", "#comedy", "#love",
];

type Step = 1 | 2;

export default function Upload() {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      toast({ title: "Galat file", description: "Sirf video files allowed hain.", variant: "destructive" });
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStep(2);
  };

  const addHashtag = (tag: string) => {
    if (caption.includes(tag)) return;
    setCaption((prev) => (prev.trim() ? `${prev.trim()} ${tag}` : tag));
  };

  const handleUpload = () => {
    if (!file) return;
    if (!caption.trim()) {
      toast({ title: "Caption zaroori hai", description: "Post karne se pehle caption likhein.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("caption", caption);

    const xhr = new XMLHttpRequest();
    const baseUrl = import.meta.env.VITE_API_URL || "";
    xhr.open("POST", `${baseUrl}/api/videos`, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadDone(true);
        setTimeout(() => setLocation(`/profile/${currentUser.username}`), 2000);
      } else {
        let msg = `Server error (${xhr.status})`;
        try { const d = JSON.parse(xhr.responseText); if (d.error) msg = d.error; } catch (_) {}
        toast({ title: "Upload failed", description: msg, variant: "destructive" });
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast({ title: "Network error", description: "Internet connection check karein.", variant: "destructive" });
    };

    xhr.timeout = 600000;
    xhr.ontimeout = () => {
      setIsUploading(false);
      toast({ title: "Timeout", description: "Video bohot bada hai ya connection slow hai.", variant: "destructive" });
    };

    xhr.send(formData);
  };

  if (uploadDone) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <p className="text-2xl font-bold">Video Upload Ho Gaya!</p>
        <p className="text-zinc-400 text-sm">Aapki profile par redirect ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => step === 2 && !isUploading ? setStep(1) : setLocation("/")}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base">
            {step === 1 ? "Video Chunein" : "Post Banayein"}
          </h1>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s <= step ? "bg-primary w-6" : "bg-zinc-800 w-3"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Select Video */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          {/* Big upload zone — native label so mobile file picker always opens */}
          <label
            htmlFor="video-file-input"
            className="w-full max-w-xs aspect-[9/16] max-h-[55vh] relative rounded-3xl overflow-hidden border-2 border-dashed border-zinc-700 active:border-primary/80 transition-all duration-300 group bg-zinc-950 flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-active:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 group-active:scale-95 transition-transform">
              <Video className="w-10 h-10 text-black" />
            </div>
            <div className="text-center px-4">
              <p className="font-bold text-white text-lg">Video Select Karein</p>
              <p className="text-zinc-500 text-sm mt-1">Tap karein ya gallery se chunein</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center px-6">
              {["MP4", "MOV", "WebM"].map((f) => (
                <span key={f} className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </label>

          {/* Tips */}
          <div className="w-full max-w-xs space-y-2">
            {[
              { icon: "✨", text: "Vertical video best dikhta hai (9:16)" },
              { icon: "🎵", text: "Original audio ke saath upload karein" },
              { icon: "📱", text: "Max size: 500MB" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-zinc-500 text-xs">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Preview + Caption */}
      {step === 2 && previewUrl && (
        <div className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Video preview */}
          <div className="relative bg-zinc-950 md:w-[45%] flex items-center justify-center">
            <div className="relative w-full max-w-[220px] mx-auto my-4">
              {/* Phone frame */}
              <div className="w-full aspect-[9/16] rounded-[28px] overflow-hidden border-4 border-zinc-800 shadow-2xl relative bg-black">
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                {/* Caption preview on video */}
                {caption && (
                  <div className="absolute bottom-4 left-3 right-3">
                    <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">
                      {caption}
                    </p>
                  </div>
                )}
              </div>
              {/* Remove button */}
              {!isUploading && (
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); setStep(1); }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-red-500/30"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
          </div>

          {/* Caption & options */}
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Apni video ke baare mein kuch likhein..."
                maxLength={500}
                rows={4}
                disabled={isUploading}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Hashtags add karein
                </span>
                <span className="text-xs text-zinc-600">{caption.length}/500</span>
              </div>
            </div>

            {/* Hashtag chips */}
            <div className="flex flex-wrap gap-2">
              {HASHTAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addHashtag(tag)}
                  disabled={isUploading}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    caption.includes(tag)
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white active:scale-95"
                  )}
                >
                  <Hash className="w-3 h-3" />
                  {tag.replace("#", "")}
                </button>
              ))}
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">Upload ho raha hai...</span>
                  <span className="text-primary font-bold text-lg">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {progress < 90 ? "Cloudinary par upload ho raha hai..." : "Almost done, database mein save ho raha hai..."}
                </p>
              </div>
            )}

            {/* Post button */}
            <button
              onClick={handleUpload}
              disabled={!caption.trim() || isUploading}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                !caption.trim() || isUploading
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-black shadow-lg shadow-primary/30 active:scale-95"
              )}
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Upload ho raha hai...</>
              ) : (
                <><ChevronRight className="w-5 h-5" /> Post Karein</>
              )}
            </button>

            <p className="text-center text-xs text-zinc-600">
              Video post karke aap India Live ki{" "}
              <span className="text-zinc-500">community guidelines</span> se agree karte hain
            </p>
          </div>
        </div>
      )}

      <input
        id="video-file-input"
        type="file"
        accept="video/*,video/mp4,video/quicktime,video/webm,video/x-msvideo"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        data-testid="input-file"
      />
    </div>
  );
}
