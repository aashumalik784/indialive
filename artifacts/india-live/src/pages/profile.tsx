import { useRoute } from "wouter";
import { useUserProfile, useUserVideos } from "@/hooks/use-api";
import { Link } from "wouter";
import { ArrowLeft, Grip, Heart, Lock, LogOut, Loader2, Search, User2, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username;
  
  const { data: profileData, isLoading: profileLoading } = useUserProfile(username || "");
  const { data: videosData, isLoading: videosLoading } = useUserVideos(profileData?.user?.id || "");
  const { currentUser, logout } = useAuth();

  const isOwnProfile = currentUser?.username === username;

  if (profileLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!profileData?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/" className="text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  const user = profileData.user;
  const videos = videosData?.videos || [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-black/80 backdrop-blur z-10">
        <Link href="/" data-testid="link-back">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-lg font-bold">{user.username}</h1>
        {isOwnProfile ? (
          <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="w-5 h-5 text-zinc-400" />
          </Button>
        ) : (
          <div className="w-6" /> // spacer
        )}
      </header>

      <main>
        {/* Profile Info */}
        <div className="flex flex-col items-center p-6 border-b border-zinc-900">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary mb-4">
            <img 
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=FF9933&color=000`} 
              alt={user.username} 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold mb-1">@{user.username}</h2>
          <div className="flex gap-6 mt-4 mb-6">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{user.video_count}</span>
              <span className="text-xs text-zinc-400">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">--</span>
              <span className="text-xs text-zinc-400">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">--</span>
              <span className="text-xs text-zinc-400">Likes</span>
            </div>
          </div>
          
          {!isOwnProfile && (
            <div className="flex gap-2 w-full max-w-xs">
              <Button className="flex-1 bg-primary text-black font-bold hover:bg-primary/90">Follow</Button>
              <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">Message</Button>
            </div>
          )}
          {isOwnProfile && (
            <Button variant="outline" className="w-full max-w-xs border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">Edit Profile</Button>
          )}

          {user.bio && (
            <p className="mt-4 text-sm text-center max-w-sm text-zinc-300">{user.bio}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex w-full border-b border-zinc-900">
          <div className="flex-1 flex justify-center py-3 border-b-2 border-primary">
            <Grip className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 flex justify-center py-3">
            <Lock className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="flex-1 flex justify-center py-3">
            <Heart className="w-5 h-5 text-zinc-600" />
          </div>
        </div>

        {/* Video Grid */}
        {videosLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : videos.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Grip className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="font-bold">No videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {videos.map((video) => (
              <Link 
                key={video.id} 
                href={`/video/${video.id}`}
                className="aspect-[3/4] bg-zinc-900 relative group overflow-hidden"
              >
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {video.view_count}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white transition-colors" data-testid="nav-home">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white transition-colors" data-testid="nav-search">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </Link>
        <Link href="/upload" className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center active:scale-95 transition-transform" data-testid="nav-upload">
          <div className="w-10 h-6 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xl leading-none font-bold">+</span>
          </div>
        </Link>
        <div className="flex flex-col items-center gap-0.5 text-primary" data-testid="nav-profile">
          <User2 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </div>
      </div>
    </div>
  );
}
