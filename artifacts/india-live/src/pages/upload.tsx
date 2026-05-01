import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, ArrowLeft, Loader2, X } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type.startsWith("video/")) {
        setFile(selected);
      } else {
        toast({ title: "Invalid file type", description: "Please select a video file.", variant: "destructive" });
      }
    }
  };

  const handleUpload = () => {
    if (!file) return;
    if (!caption.trim()) {
      toast({ title: "Caption required", description: "Please add a caption before posting.", variant: "destructive" });
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
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast({ title: "Video uploaded successfully!" });
        setLocation(`/profile/${currentUser.username}`);
      } else {
        let errorMsg = `Server error (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) errorMsg = data.error;
        } catch (_) {}
        toast({ title: "Upload failed", description: errorMsg, variant: "destructive" });
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast({ title: "Upload failed", description: "Network error — check your connection.", variant: "destructive" });
    };

    xhr.ontimeout = () => {
      setIsUploading(false);
      toast({ title: "Upload timed out", description: "The video is too large or connection is slow.", variant: "destructive" });
    };

    xhr.timeout = 600000;

    xhr.send(formData);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col">
      <header className="flex items-center p-4 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-10">
        <Link href="/" className="mr-4" data-testid="link-back">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-xl font-bold flex-1">New Post</h1>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="bg-primary text-black font-bold hover:bg-primary/90"
          data-testid="button-post"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Post"}
        </Button>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-6">
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[9/16] max-h-[60vh] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            data-testid="button-select-video"
          >
            <UploadCloud className="w-12 h-12 text-zinc-500 mb-4" />
            <p className="text-zinc-400 font-medium">Tap to select video</p>
            <p className="text-zinc-600 text-sm mt-2">MP4, MOV, WebM up to 500MB</p>
          </div>
        ) : (
          <div className="relative w-full aspect-[9/16] max-h-[60vh] bg-zinc-900 rounded-2xl overflow-hidden">
            <video 
              src={URL.createObjectURL(file)} 
              className="w-full h-full object-contain"
              controls
            />
            {!isUploading && (
              <button 
                onClick={() => setFile(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-white mb-4">{progress}%</div>
                <div className="w-2/3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          data-testid="input-file"
        />

        <div className="space-y-2">
          <Label htmlFor="caption" className="text-zinc-300 font-semibold">Caption</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption... #trending"
            className="bg-zinc-900 border-zinc-800 text-white min-h-[100px] resize-none focus-visible:ring-primary"
            data-testid="input-caption"
            disabled={isUploading}
          />
        </div>
      </main>
    </div>
  );
}
