import { Link } from "wouter";
import { Home, Search, Bell, User2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "home" | "search" | "notifications" | "profile";

function useUnreadCount() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await apiRequest("/api/notifications/unread-count");
      const data = await res.json();
      return data.unread_count as number;
    },
    enabled: !!currentUser,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export default function BottomNav({ active }: { active: Tab }) {
  const { currentUser } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <div className="fixed bottom-0 w-full h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-50">
      <Link href="/" className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active === "home" ? "text-primary" : "text-zinc-400 hover:text-white"
      )}>
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Home</span>
      </Link>

      <Link href="/search" className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active === "search" ? "text-primary" : "text-zinc-400 hover:text-white"
      )}>
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Search</span>
      </Link>

      <Link href="/upload" className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center active:scale-95 transition-transform">
        <div className="w-10 h-6 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black text-xl leading-none font-bold">+</span>
        </div>
      </Link>

      <Link href="/notifications" className={cn(
        "flex flex-col items-center gap-1 transition-colors relative",
        active === "notifications" ? "text-primary" : "text-zinc-400 hover:text-white"
      )}>
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold">Alerts</span>
      </Link>

      <Link
        href={currentUser ? "/account" : "/login"}
        className={cn(
          "flex flex-col items-center gap-1 transition-colors",
          active === "profile" ? "text-primary" : "text-zinc-400 hover:text-white"
        )}
      >
        {currentUser?.avatar_url ? (
          <img src={currentUser.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover border border-zinc-700" />
        ) : (
          <User2 className="w-5 h-5" />
        )}
        <span className="text-[10px] font-semibold">Account</span>
      </Link>
    </div>
  );
}
