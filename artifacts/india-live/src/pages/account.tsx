import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVideos } from "@/hooks/use-api";
import {
  Settings, Edit3, Play, Grid,
  Heart, Users, Video, Bell, ChevronRight,
  UserPlus, Calendar, ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BottomNav from "@/components/BottomNav";

export default function AccountPage() {
  const { currentUser } = useAuth();

  const { data: videosData } = useUserVideos(currentUser?.id || "");
  const videos = videosData?.videos || [];

  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center gap-5 pb-16 px-6">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Users className="w-10 h-10 text-zinc-600" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-1">Account nahi hai?</p>
          <p className="text-zinc-500 text-sm">Login ya signup karein apna account dekhne ke liye</p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-3">
          <Link href="/login" className="w-full py-3 bg-primary text-black font-bold rounded-2xl text-center text-sm">
            Login Karein
          </Link>
          <Link href="/signup" className="w-full py-3 border border-zinc-700 text-white font-semibold rounded-2xl text-center text-sm">
            Naya Account Banayein
          </Link>
        </div>
        <BottomNav active="profile" />
      </div>
    );
  }

  const memberSince = currentUser.created_at
    ? formatDistanceToNow(new Date(currentUser.created_at), { addSuffix: true })
    : null;

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 flex items-center justify-between px-4 h-14">
        <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base">My Account</h1>
        <Link href="/settings" className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      {/* Profile Hero */}
      <div className="flex flex-col items-center px-4 pt-6 pb-4 border-b border-zinc-900">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
            <img
              src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.display_name || currentUser.username)}&background=FF9933&color=000`}
              alt={currentUser.username}
              className="w-full h-full object-cover"
            />
          </div>
          <Link
            href="/settings"
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full border-2 border-black flex items-center justify-center"
          >
            <Edit3 className="w-3.5 h-3.5 text-black" />
          </Link>
        </div>

        <h2 className="text-xl font-bold">{currentUser.display_name || currentUser.username}</h2>
        <p className="text-sm text-zinc-500 mb-1">@{currentUser.username}</p>
        {currentUser.bio && (
          <p className="text-sm text-zinc-400 text-center max-w-xs mt-1">{currentUser.bio}</p>
        )}
        {memberSince && (
          <div className="flex items-center gap-1 mt-2 text-zinc-600 text-xs">
            <Calendar className="w-3 h-3" />
            <span>Member {memberSince}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-4 mb-4">
          <div className="flex flex-col items-center">
            <span className="font-bold text-xl leading-tight">{currentUser.video_count ?? videos.length}</span>
            <span className="text-xs text-zinc-500 mt-0.5">Videos</span>
          </div>
          <Link href={`/profile/${currentUser.username}`} className="flex flex-col items-center">
            <span className="font-bold text-xl leading-tight">{currentUser.follower_count ?? 0}</span>
            <span className="text-xs text-zinc-500 mt-0.5">Followers</span>
          </Link>
          <Link href={`/profile/${currentUser.username}`} className="flex flex-col items-center">
            <span className="font-bold text-xl leading-tight">{currentUser.following_count ?? 0}</span>
            <span className="text-xs text-zinc-500 mt-0.5">Following</span>
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full max-w-xs">
          <Link
            href="/settings"
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-white text-sm font-semibold text-center hover:bg-zinc-900 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href={`/profile/${currentUser.username}`}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-white text-sm font-semibold text-center hover:bg-zinc-900 transition-colors"
          >
            Public Profile
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-1">Quick Access</p>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-900">
          <QuickLink href="/upload" icon={<Video className="w-4 h-4 text-primary" />} label="Video Upload Karein" />
          <QuickLink href="/notifications" icon={<Bell className="w-4 h-4 text-yellow-400" />} label="Notifications" />
          <QuickLink href="/search" icon={<UserPlus className="w-4 h-4 text-blue-400" />} label="Creators Dhundein" />
          <QuickLink href="/settings" icon={<Settings className="w-4 h-4 text-zinc-400" />} label="Settings" />
        </div>
      </div>

      {/* My Videos */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-white uppercase tracking-wide">Mere Videos</p>
          </div>
          {videos.length > 6 && (
            <Link href={`/profile/${currentUser.username}`} className="text-xs text-primary font-semibold">
              Sab dekho
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <Play className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-sm font-semibold text-zinc-500">Abhi koi video nahi</p>
            <Link href="/upload" className="px-5 py-2 bg-primary text-black font-bold rounded-full text-sm">
              Pehla Video Upload Karein
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
            {videos.slice(0, 9).map((video: any) => (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="aspect-[3/4] bg-zinc-900 relative overflow-hidden group"
              >
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.caption} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Play className="w-7 h-7 text-zinc-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1">
                  <Play className="w-3 h-3 fill-white text-white flex-shrink-0" />
                  <span className="text-white text-xs font-semibold drop-shadow">{video.view_count}</span>
                  <span className="ml-auto flex items-center gap-0.5 text-white text-xs font-semibold drop-shadow">
                    <Heart className="w-3 h-3 fill-white" />
                    {video.like_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="profile" />

    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900 transition-colors">
      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm font-semibold text-white">{label}</span>
      <ChevronRight className="w-4 h-4 text-zinc-600" />
    </Link>
  );
}
