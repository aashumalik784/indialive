import { useBookmarks, useToggleBookmark } from "@/hooks/use-api";
import { Link } from "wouter";
import { ArrowLeft, Bookmark, Loader2, BookmarkX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

export default function BookmarksPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useBookmarks();
  const { mutate: toggleBookmark } = useToggleBookmark();

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  const videos = data?.videos || [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-10">
        <Link href="/" className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base flex-1">Saved Videos</h1>
        <Bookmark className="w-5 h-5 text-primary" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-zinc-700" />
          </div>
          <p className="font-bold text-zinc-500">Koi saved video nahi</p>
          <p className="text-sm text-zinc-600 text-center px-8">Videos ko bookmark karein — woh yahan dikh jaayenge</p>
          <Link href="/" className="mt-2 px-5 py-2 bg-primary text-black font-bold rounded-full text-sm">
            Videos Dekho
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {videos.map(video => (
            <div key={video.id} className="relative aspect-[3/4] bg-zinc-900 overflow-hidden group">
              <Link href={`/video/${video.id}`}>
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M8 5v14l11-7z" /></svg>
                  {video.view_count}
                </div>
              </Link>
              <button
                onClick={() => toggleBookmark(String(video.id))}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove bookmark"
              >
                <BookmarkX className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
