import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UploadCloud, ImageIcon, Video, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function StoriesCreate() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      toast({ title: "Sirf image ya video allowed hai", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("media", file);
      if (caption) formData.append("caption", caption);
      formData.append("duration_hours", "24");

      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/stories`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setDone(true);
      setTimeout(() => setLocation("/"), 1500);
    } catch (err: any) {
      toast({ title: "Story upload nahi ho saka", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (done) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-5 text-white">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <p className="text-xl font-bold">Story Post Ho Gayi!</p>
        <p className="text-zinc-400 text-sm">24 ghante mein expire hogi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900">
        <Link href="/" className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base flex-1">Story Banayein</h1>
        {file && (
          <button
            onClick={handlePost}
            disabled={isUploading}
            className="px-4 py-1.5 bg-primary text-black font-bold rounded-full text-sm disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
          </button>
        )}
      </header>

      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <label className="w-full max-w-xs aspect-[9/16] max-h-[60vh] relative rounded-3xl overflow-hidden border-2 border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center gap-4 cursor-pointer active:border-primary transition-all">
            <input type="file" accept="image/*,video/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <p className="font-bold text-white text-center">Photo ya Video Select Karein</p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-zinc-500 text-xs"><ImageIcon className="w-4 h-4" /> Photo</span>
              <span className="flex items-center gap-1 text-zinc-500 text-xs"><Video className="w-4 h-4" /> Video</span>
            </div>
          </label>
          <p className="text-zinc-600 text-xs text-center">Story 24 ghante baad automatically delete ho jaayegi</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
            {file.type.startsWith("video/") ? (
              <video src={previewUrl!} autoPlay loop playsInline muted className="w-full h-full object-contain max-h-[70vh]" />
            ) : (
              <img src={previewUrl!} alt="" className="w-full h-full object-contain max-h-[70vh]" />
            )}
          </div>
          <div className="p-4 space-y-3 border-t border-zinc-900 bg-zinc-950">
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption likhein (optional)..."
              maxLength={200}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="w-full py-2.5 border border-zinc-700 text-zinc-400 font-semibold rounded-xl text-sm"
            >
              Dobara Chunein
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
