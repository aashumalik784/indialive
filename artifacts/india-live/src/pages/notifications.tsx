import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BottomNav from "@/components/BottomNav";

type Notif = {
  id: number;
  type: "like" | "comment" | "follow";
  read: boolean;
  created_at: string;
  actor: { id: number; username: string; avatar_url: string | null };
  video?: { id: number; thumbnail_url: string | null; caption: string };
};

function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiRequest("/api/notifications");
      const data = await res.json();
      return data as { notifications: Notif[]; unread_count: number };
    },
    staleTime: 10_000,
  });
}

function notifText(n: Notif) {
  if (n.type === "like") return "ne aapki video ko like kiya";
  if (n.type === "comment") return "ne aapki video par comment kiya";
  if (n.type === "follow") return "ne aapko follow kiya";
  return "";
}

function notifIcon(type: string) {
  if (type === "like") return <Heart className="w-4 h-4 fill-red-500 text-red-500" />;
  if (type === "comment") return <MessageCircle className="w-4 h-4 text-blue-400" />;
  if (type === "follow") return <UserPlus className="w-4 h-4 text-green-400" />;
  return null;
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return;
    apiRequest("/api/notifications/read-all", { method: "POST" }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center gap-4 pb-16">
        <Bell className="w-12 h-12 text-zinc-700" />
        <p className="text-zinc-400">Notifications dekhne ke liye login karein</p>
        <Link href="/login" className="text-primary font-semibold">Login Karein</Link>
        <BottomNav active="notifications" />
      </div>
    );
  }

  const notifications = data?.notifications || [];

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col pb-16">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 px-4 h-14 flex items-center">
        <h1 className="font-bold text-lg">Notifications</h1>
      </header>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-600 gap-3 py-24">
          <Bell className="w-14 h-14 opacity-25" />
          <p className="font-semibold text-lg">Koi notification nahi</p>
          <p className="text-sm text-zinc-700 text-center px-8">Jab koi aapki video like kare, comment kare ya follow kare — yahan dikhai dega</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="divide-y divide-zinc-900">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.video ? `/video/${n.video.id}` : `/profile/${n.actor.username}`}
              className={`flex items-center gap-3 px-4 py-3 active:bg-zinc-900 transition-colors ${!n.read ? "bg-zinc-950" : ""}`}
            >
              {/* Actor avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
                  {n.actor.avatar_url ? (
                    <img src={n.actor.avatar_url} alt={n.actor.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-lg">
                      {n.actor.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800">
                  {notifIcon(n.type)}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-bold">@{n.actor.username}</span>{" "}
                  <span className="text-zinc-300">{notifText(n)}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Video thumbnail if applicable */}
              {n.video?.thumbnail_url && (
                <div className="w-11 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                  <img src={n.video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Unread dot */}
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}

      <BottomNav active="notifications" />
    </div>
  );
}
