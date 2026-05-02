import { useAnalytics } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Eye, Heart, MessageCircle, Users, TrendingUp, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-black text-white">{fmt(value)}</p>
      <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  if (!currentUser) { setLocation("/login"); return null; }

  const { data, isLoading } = useAnalytics(currentUser.username);

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-10">
        <Link href={`/profile/${currentUser.username}`} className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base flex-1">Creator Analytics</h1>
        <TrendingUp className="w-5 h-5 text-primary" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="p-4 space-y-5">
          {/* Stat cards */}
          <div className="flex gap-3">
            <StatCard icon={<Eye className="w-5 h-5 text-blue-400" />} label="Total Views" value={data.total_views} color="bg-blue-500/20" />
            <StatCard icon={<Heart className="w-5 h-5 text-red-400" />} label="Total Likes" value={data.total_likes} color="bg-red-500/20" />
          </div>
          <div className="flex gap-3">
            <StatCard icon={<MessageCircle className="w-5 h-5 text-green-400" />} label="Comments" value={data.total_comments} color="bg-green-500/20" />
            <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Followers" value={data.follower_count} color="bg-primary/20" />
          </div>

          {/* Quick summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <p className="font-bold text-sm text-zinc-300">Account Summary</p>
            {[
              { label: "Total Videos", value: data.video_count },
              { label: "Following", value: data.following_count },
              { label: "Avg Views per Video", value: data.video_count > 0 ? Math.round(data.total_views / data.video_count) : 0 },
              { label: "Avg Likes per Video", value: data.video_count > 0 ? Math.round(data.total_likes / data.video_count) : 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                <span className="text-zinc-400 text-sm">{label}</span>
                <span className="text-white font-bold text-sm">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Per-video table */}
          <div>
            <p className="font-bold text-sm text-zinc-300 mb-3">Video Performance</p>
            <div className="space-y-2">
              {data.videos.map(v => (
                <Link key={v.id} href={`/video/${v.id}`} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <img src={v.thumbnail_url} alt="" className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{v.caption}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{formatDistanceToNow(new Date(v.created_at))} ago</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs text-blue-400 flex items-center gap-1"><Eye className="w-3 h-3" />{v.view_count.toLocaleString()}</span>
                      <span className="text-xs text-red-400 flex items-center gap-1"><Heart className="w-3 h-3" />{v.like_count.toLocaleString()}</span>
                      <span className="text-xs text-green-400 flex items-center gap-1"><MessageCircle className="w-3 h-3" />{v.comment_count.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">Analytics load nahi ho sake</div>
      )}
    </div>
  );
}
