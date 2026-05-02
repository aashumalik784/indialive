import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, User2, Lock, LogOut, ChevronRight,
  Check, Loader2, Trash2, Info, Shield
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Section = "main" | "edit-profile" | "change-password" | "delete-account" | "about";

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("main");

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Please log in to access settings</p>
        <Link href="/login" className="text-primary font-semibold hover:underline">Log In</Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-900 flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => section === "main" ? setLocation(`/profile/${currentUser.username}`) : setSection("main")}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">
          {section === "main" && "Settings"}
          {section === "edit-profile" && "Edit Profile"}
          {section === "change-password" && "Change Password"}
          {section === "delete-account" && "Delete Account"}
          {section === "about" && "About"}
        </h1>
      </header>

      {section === "main" && <MainMenu currentUser={currentUser} setSection={setSection} onLogout={handleLogout} />}
      {section === "edit-profile" && <EditProfile currentUser={currentUser} onDone={() => setSection("main")} />}
      {section === "change-password" && <ChangePassword onDone={() => setSection("main")} />}
      {section === "delete-account" && <DeleteAccount onDeleted={() => { logout(); setLocation("/"); }} />}
      {section === "about" && <About />}
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick, danger }: {
  icon: React.ReactNode; label: string; sub?: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 active:bg-zinc-900 transition-colors text-left",
        danger ? "text-red-500" : "text-white"
      )}
    >
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
        danger ? "bg-red-500/10" : "bg-zinc-900"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        {sub && <div className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</div>}
      </div>
      {!danger && <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />}
    </button>
  );
}

function MainMenu({ currentUser, setSection, onLogout }: any) {
  return (
    <div className="mt-2">
      {/* Profile card */}
      <div className="mx-4 mb-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
          <img
            src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.username}&background=FF9933&color=000`}
            alt={currentUser.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white truncate">@{currentUser.username}</p>
          <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
          {currentUser.bio && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{currentUser.bio}</p>}
        </div>
      </div>

      {/* Account section */}
      <div className="mx-4 mb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1 mb-1">Account</p>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-900">
          <MenuItem
            icon={<User2 className="w-5 h-5 text-primary" />}
            label="Edit Profile"
            sub="Username, bio, avatar"
            onClick={() => setSection("edit-profile")}
          />
          <MenuItem
            icon={<Lock className="w-5 h-5 text-secondary" />}
            label="Change Password"
            sub="Update your password"
            onClick={() => setSection("change-password")}
          />
        </div>
      </div>

      {/* Info section */}
      <div className="mx-4 mb-2 mt-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1 mb-1">App</p>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-900">
          <MenuItem
            icon={<Info className="w-5 h-5 text-zinc-400" />}
            label="About India Live"
            sub="Version, contact info"
            onClick={() => setSection("about")}
          />
          <MenuItem
            icon={<Shield className="w-5 h-5 text-zinc-400" />}
            label="Privacy & Safety"
            sub="Your data is safe"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mx-4 mb-2 mt-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-900">
          <MenuItem
            icon={<LogOut className="w-5 h-5 text-red-500" />}
            label="Log Out"
            onClick={onLogout}
            danger
          />
          <MenuItem
            icon={<Trash2 className="w-5 h-5 text-red-500" />}
            label="Delete Account"
            onClick={() => setSection("delete-account")}
            danger
          />
        </div>
      </div>
    </div>
  );
}

function EditProfile({ currentUser, onDone }: { currentUser: any; onDone: () => void }) {
  const [displayName, setDisplayName] = useState(currentUser.display_name || currentUser.username);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, username, bio, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Update failed", variant: "destructive" });
        return;
      }
      localStorage.setItem("india_live_user", JSON.stringify(data.user));
      toast({ title: "Profile update ho gaya!" });
      onDone();
      window.location.href = `/profile/${data.user.username}`;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Avatar preview + change */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
            <img
              src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=FF9933&color=000`}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${displayName}&background=FF9933&color=000`; }}
            />
          </div>
        </div>
        <div className="w-full space-y-1.5">
          <Label className="text-zinc-500 text-xs">Profile Photo URL</Label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary text-sm"
          />
          <p className="text-xs text-zinc-600">Apni photo ka link yahan paste karein</p>
        </div>
      </div>

      <div className="h-px bg-zinc-900" />

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Naam (Display Name)</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Apna pura naam"
          maxLength={100}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary"
        />
        <p className="text-xs text-zinc-600">Yeh naam aapki profile par dikhega (jaise Rahul Sharma)</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
            placeholder="username"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary pl-7"
          />
        </div>
        <p className="text-xs text-zinc-600">Sirf letters, numbers, _ aur . allowed hain</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Bio</Label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Apne baare mein kuch batayein..."
          maxLength={300}
          rows={3}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-zinc-600 text-right">{bio.length}/300</p>
      </div>

      <Button
        onClick={handleSave}
        disabled={isLoading || !username.trim() || !displayName.trim()}
        className="w-full bg-primary text-black font-bold hover:bg-primary/90 py-6 text-base rounded-xl"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
        Save Karein
      </Button>
    </div>
  );
}

function ChangePassword({ onDone }: { onDone: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Password too short", description: "At least 6 characters required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await apiRequest("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      toast({ title: "Password changed successfully!" });
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wide">Current Password</Label>
        <Input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="••••••••"
          className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-primary"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wide">New Password</Label>
        <Input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="••••••••"
          className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-primary"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wide">Confirm New Password</Label>
        <Input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="••••••••"
          className={cn(
            "bg-zinc-900 border-zinc-800 text-white focus-visible:ring-primary",
            confirmPw && newPw !== confirmPw && "border-red-500"
          )}
        />
        {confirmPw && newPw !== confirmPw && (
          <p className="text-xs text-red-400">Passwords don't match</p>
        )}
      </div>
      <Button
        onClick={handleSave}
        disabled={isLoading || !currentPw || !newPw || !confirmPw}
        className="w-full bg-primary text-black font-bold hover:bg-primary/90"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
        Update Password
      </Button>
    </div>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiRequest("/api/users/me/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      toast({ title: "Account deleted" });
      onDeleted();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
        <p className="text-red-400 text-sm font-semibold mb-1">⚠️ Yeh action undo nahi ho sakta</p>
        <p className="text-red-400/80 text-xs">Aapka account, saari videos, likes aur comments hamesha ke liye delete ho jayenge.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wide">Confirm with your Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-red-500"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-red-500"
        />
        <span className="text-xs text-zinc-400">Main samajhta/samajhti hun ki mera account permanently delete ho jayega</span>
      </label>

      <Button
        onClick={handleDelete}
        disabled={isLoading || !password || !confirmed}
        className="w-full bg-red-600 text-white font-bold hover:bg-red-700"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
        Delete My Account
      </Button>
    </div>
  );
}

function About() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col items-center py-6">
        <div className="text-3xl font-black tracking-tighter mb-1">
          <span className="text-primary">INDIA</span><span className="text-secondary">LIVE</span>
        </div>
        <p className="text-zinc-500 text-sm">Version 1.0.0</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-900">
        {[
          { label: "Platform", value: "IndiaLive" },
          { label: "Made in", value: "🇮🇳 India" },
          { label: "Contact", value: "support@indialive.app" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-zinc-500 text-sm">{label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-700 pt-4">
        © 2026 IndiaLive. All rights reserved.
      </p>
    </div>
  );
}
