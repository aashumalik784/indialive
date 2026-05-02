import { useConversations, useUnreadCount } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { ArrowLeft, MessageCircle, Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BottomNav from "@/components/BottomNav";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useConversations();

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  const conversations = data?.conversations || [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-10">
        <Link href="/" className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-base flex-1">Messages</h1>
        <MessageCircle className="w-5 h-5 text-primary" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-zinc-700" />
          </div>
          <p className="font-bold text-zinc-500">Koi message nahi</p>
          <p className="text-sm text-zinc-600 text-center px-8">Kisi ke profile par jaake Message button dabayein</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900">
          {conversations.map(convo => (
            <Link key={convo.user.id} href={`/conversation/${convo.user.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
              <div className="relative flex-shrink-0">
                <img
                  src={convo.user.avatar_url || `https://ui-avatars.com/api/?name=${convo.user.username}&background=FF9933&color=000`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                />
                {convo.unread_count > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-black text-xs font-bold">{convo.unread_count > 9 ? "9+" : convo.unread_count}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className={`font-semibold text-sm truncate ${convo.unread_count > 0 ? "text-white" : "text-zinc-300"}`}>
                    {convo.user.display_name}
                  </p>
                  <span className="text-zinc-600 text-xs ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: false })}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${convo.unread_count > 0 ? "text-zinc-300 font-medium" : "text-zinc-500"}`}>
                  {convo.last_message.sender_id === String(currentUser.id) ? "Aapne: " : ""}
                  {convo.last_message.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
