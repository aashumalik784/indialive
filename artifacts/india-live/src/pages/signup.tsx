import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, User2, Mail, Lock, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password chhota hai", description: "Kam se kam 6 characters chahiye", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signup({ display_name: displayName, email, username, password });
      toast({ title: "Account ban gaya! Swagat hai!" });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      {/* Top gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="text-4xl font-black tracking-tighter mb-1">
            <span className="text-primary">INDIA</span><span className="text-secondary">LIVE</span>
          </div>
          <p className="text-zinc-500 text-sm">India ka apna short video platform</p>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-1">Account Banayein</h1>
          <p className="text-zinc-500 text-sm mb-6">Free mein join karein</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Display Name */}
            <div className="relative">
              <User2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Apna pura naam (jaise Rahul Sharma)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Username */}
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                required
                placeholder="Username (jaise rahul_sharma)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password (kam se kam 6 characters)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 text-sm pl-10 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {password && (
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      password.length >= i * 4
                        ? i === 1 ? "bg-red-500" : i === 2 ? "bg-yellow-500" : "bg-green-500"
                        : "bg-zinc-800"
                    )}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !displayName.trim() || !username.trim() || !email.trim() || !password}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-2",
                isLoading || !displayName.trim() || !username.trim() || !email.trim() || !password
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-black shadow-lg shadow-primary/30 active:scale-95"
              )}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isLoading ? "Account ban raha hai..." : "Account Banayein"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Pehle se account hai?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Login Karein
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
