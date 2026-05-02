import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Play, Hash, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

function useHashtagVideos(tag: string) {
  return useQuery({
    queryKey: ["hashtag", tag],
    queryFn: async () => {
      const res = await apiRequest(`/api/search?q=${encodeURIComponent("#" + tag)}&kind=videos&per_page=30`);
      const data = await res.json();
      return data as { videos: any[]; video_total: number };
    },
    enabled: !!tag,
    staleTime: 30_000,
  });
}

export default function HashtagPage() {
  const [, params] = useRoute("/hashtag/:tag");
  const tag = params?.tag || "";
  const { data, isLoading } = useHashtagVideos(tag);

  const videos = data?.videos || [];
  const total = data?.video_total || 0;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col pb-16">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 px-4 h-14 flex items-center gap-3">
        <Link href="/search">
          <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">#{tag}</h1>
            <p className="text-xs text-zinc-500">{total} videos</p>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-24 text-zinc-600 gap-3">
          <Hash className="w-14 h-14 opacity-25" />
          <p className="font-semibold">Koi video nahi mila</p>
          <p className="text-sm text-zinc-700">#{tag} ke saath abhi koi video nahi hai</p>
        </div>
      )}

      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/video/${video.id}`}
              className="aspect-[3/4] bg-zinc-900 relative overflow-hidden group"
            >
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <Play className="w-8 h-8 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                <Play className="w-3 h-3 fill-white flex-shrink-0" />
                <span>{video.view_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav active="search" />
    </div>
  );
}
