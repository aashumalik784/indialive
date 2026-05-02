import { useRoute, Link } from "wouter";
import { useUserProfile, useUserVideos, useFollowUser } from "@/hooks/use-api";
import {
  ArrowLeft, Grip, Heart, Loader2,
  User2, Settings, UserCheck, UserPlus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username;

  const { data: profileData, isLoading: profileLoading } = useUserProfile(username || "");
  const { data: videosData, isLoading: videosLoading } = useUserVideos(profileData?.user?.id || "");
  const { mutate: toggleFollow, isPending: followPending } = useFollowUser();
  const { currentUser, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <User2 className="w-16 h-16 text-zinc-700" />
        <p className="text-zinc-400 font-semibold">User nahi mila</p>
        <Link href="/" className="text-primary text-sm">Home par jaao</Link>
      </div>
    );
  }

  const user = profileData.user;
  const videos = videosData?.videos || [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 sticky top-0 bg-black/90 backdrop-blur z-10 border-b border-zinc-900">
        <Link href="/" data-testid="link-back">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-base font-bold">@{user.username}</h1>
        {isOwnProfile ? (
          <Link href="/settings">
            <Settings className="w-5 h-5 text-zinc-400" />
          </Link>
        ) : (
          <div className="w-5" />
        )}
      </header>

      <main>
        {/* Profile Info */}
        <div className="flex flex-col items-center px-4 pt-6 pb-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary mb-3 shadow-lg shadow-primary/20">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=FF9933&color=000`}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-xl font-bold mb-0">{user.display_name || user.username}</h2>
          <p className="text-sm text-zinc-500 mb-1">@{user.username}</p>
          {user.bio && <p className="text-sm text-zinc-400 text-center max-w-xs mt-1 mb-2">{user.bio}</p>}

          {/* Stats row */}
          <div className="flex gap-8 my-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg leading-tight">{user.video_count}</span>
              <span className="text-xs text-zinc-500 mt-0.5">Posts</span>
            </div>
            <Link href={`/profile/${user.username}/followers`} className="flex flex-col items-center">
              <span className="font-bold text-lg leading-tight">{user.follower_count ?? 0}</span>
              <span className="text-xs text-zinc-500 mt-0.5">Followers</span>
            </Link>
            <Link href={`/profile/${user.username}/following`} className="flex flex-col items-center">
              <span className="font-bold text-lg leading-tight">{user.following_count ?? 0}</span>
              <span className="text-xs text-zinc-500 mt-0.5">Following</span>
            </Link>
          </div>

          {/* Action buttons */}
          {isOwnProfile ? (
            <div className="flex gap-2 w-full max-w-xs">
              <Link
                href="/settings"
                className="flex-1 py-2 rounded-xl border border-zinc-700 text-white text-sm font-semibold text-center hover:bg-zinc-900 transition-colors"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : currentUser ? (
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={() => toggleFollow(user.username)}
                disabled={followPending}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                  user.is_following
                    ? "bg-zinc-800 border border-zinc-700 text-white"
                    : "bg-primary text-black shadow-md shadow-primary/20"
                )}
              >
                {followPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.is_following ? (
                  <><UserCheck className="w-4 h-4" /> Following</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Follow Karein</>
                )}
              </button>
              <button className="px-4 py-2 rounded-xl border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-900 transition-colors">
                Message
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-primary text-black text-sm font-bold"
            >
              Follow karne ke liye login karein
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex w-full border-b border-zinc-900 mt-2">
          <div className="flex-1 flex justify-center py-3 border-b-2 border-primary">
            <Grip className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 flex justify-center py-3">
            <Heart className="w-5 h-5 text-zinc-600" />
          </div>
        </div>

        {/* Video Grid */}
        {videosLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-zinc-600">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <Grip className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="font-bold text-zinc-500">Abhi koi video nahi</p>
            {isOwnProfile && (
              <Link href="/upload" className="text-primary text-sm">Pehla video upload karein</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="aspect-[3/4] bg-zinc-900 relative overflow-hidden"
              >
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M8 5v14l11-7z" /></svg>
                  {video.view_count}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="profile" />

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-3">
            <p className="text-white font-bold text-center text-lg">Logout karna chahte hain?</p>
            <button
              onClick={() => { logout(); setShowLogoutConfirm(false); }}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl"
            >
              Haan, Logout Karein
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-3 bg-zinc-800 text-white font-semibold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
