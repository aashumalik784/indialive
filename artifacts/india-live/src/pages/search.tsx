import { useState, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Search, X, Play, User2, Home, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResults = {
  query: string;
  videos?: any[];
  users?: any[];
  video_total?: number;
  user_total?: number;
};

type TrendingData = {
  trending_videos: any[];
  trending_tags: { tag: string; count: number }[];
  popular_creators: any[];
};

function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const res = await apiRequest(`/api/search?q=${encodeURIComponent(q)}&kind=all`);
      return res.json() as Promise<SearchResults>;
    },
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  });
}

function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await apiRequest("/api/search/trending");
      return res.json() as Promise<TrendingData>;
    },
    staleTime: 60_000,
  });
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tab, setTab] = useState<"videos" | "users">("videos");
  const { currentUser } = useAuth();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useSearch(debouncedQ);
  const { data: trending, isLoading: trendingLoading } = useTrending();

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(value), 400);
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQ("");
    inputRef.current?.focus();
  };

  const handleTagClick = (tag: string) => {
    const q = `#${tag}`;
    setQuery(q);
    setDebouncedQ(q);
    setTab("videos");
  };

  const videos = data?.videos || [];
  const users = data?.users || [];
  const hasResults = debouncedQ.trim().length > 0;

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 bg-zinc-900 rounded-full px-4 py-2.5 border border-zinc-800 focus-within:border-primary transition-colors">
          <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Videos ya creators dhundho..."
            className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none"
            autoFocus
          />
          {query && (
            <button onClick={handleClear} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {hasResults && (
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setTab("videos")}
              className={cn(
                "flex-1 py-1.5 rounded-full text-sm font-semibold transition-colors",
                tab === "videos" ? "bg-primary text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              Videos {data?.video_total !== undefined ? `(${data.video_total})` : ""}
            </button>
            <button
              onClick={() => setTab("users")}
              className={cn(
                "flex-1 py-1.5 rounded-full text-sm font-semibold transition-colors",
                tab === "users" ? "bg-primary text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              Creators {data?.user_total !== undefined ? `(${data.user_total})` : ""}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1">

        {/* EXPLORE — shown when no query */}
        {!hasResults && (
          <>
            {trendingLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* Trending Hashtags */}
                {trending && trending.trending_tags.length > 0 && (
                  <div className="px-4 pt-5 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-bold text-white tracking-wide uppercase">Trending Hashtags</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trending.trending_tags.map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 rounded-full px-3 py-1.5 transition-colors"
                        >
                          <span className="text-primary font-bold text-sm">#</span>
                          <span className="text-white text-sm font-semibold">{tag}</span>
                          <span className="text-zinc-500 text-xs ml-0.5">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Creators */}
                {trending && trending.popular_creators.length > 0 && (
                  <div className="px-4 pt-5 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <User2 className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-bold text-white tracking-wide uppercase">Popular Creators</h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {trending.popular_creators.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.username}`}
                          className="flex flex-col items-center gap-2 flex-shrink-0 w-20 active:opacity-70 transition-opacity"
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary bg-zinc-900 flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User2 className="w-7 h-7 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 font-semibold truncate w-full text-center">@{user.username}</p>
                          <p className="text-[10px] text-zinc-600 -mt-1">{user.video_count} videos</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Videos grid */}
                {trending && trending.trending_videos.length > 0 && (
                  <div className="pt-5">
                    <div className="flex items-center gap-2 mb-3 px-4">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-bold text-white tracking-wide uppercase">Trending Videos</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                      {trending.trending_videos.map((video) => (
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                            <Play className="w-3 h-3 fill-white flex-shrink-0" />
                            <span>{video.view_count}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty explore state */}
                {trending && trending.trending_videos.length === 0 && trending.trending_tags.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                    <Search className="w-14 h-14 mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Kuch dhundho</p>
                    <p className="text-sm mt-1 text-zinc-700">Videos ya creators ka naam likhein</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* SEARCH RESULTS */}
        {hasResults && isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {hasResults && !isLoading && tab === "videos" && (
          <>
            {videos.length === 0 ? (
              <EmptyState text={`"${debouncedQ}" ke liye koi video nahi mila`} />
            ) : (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
                    <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                      <Play className="w-3 h-3 fill-white" />
                      <span>{video.view_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {hasResults && !isLoading && tab === "users" && (
          <div className="divide-y divide-zinc-900">
            {users.length === 0 ? (
              <EmptyState text={`"${debouncedQ}" naam ka koi creator nahi mila`} />
            ) : (
              users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-4 px-4 py-3 active:bg-zinc-900 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0 bg-zinc-900">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User2 className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">@{user.username}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{user.video_count} videos</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-primary">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </Link>
        <Link href="/upload" className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center active:scale-95 transition-transform">
          <div className="w-10 h-6 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xl leading-none font-bold">+</span>
          </div>
        </Link>
        <Link href={currentUser ? `/profile/${currentUser.username}` : "/login"} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <User2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 px-8">
      <Search className="w-12 h-12 mb-3 opacity-25" />
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}
