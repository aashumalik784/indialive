import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useMessages, useSendMessage, useUserProfile } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationPage() {
  const [, params] = useRoute("/conversation/:userId");
  const otherUserId = params?.userId || "";
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data: messages, isLoading } = useMessages(otherUserId);
  const { data: profileData } = useUserProfile(otherUserId);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  if (!currentUser) { setLocation("/login"); return null; }

  const otherUser = profileData?.user;
  const msgs = messages?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const handleSend = () => {
    if (!text.trim() || isPending) return;
    sendMessage({ otherUserId, content: text.trim() });
    setText("");
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-900 flex-shrink-0">
        <Link href="/messages" className="w-8 h-8 flex items-center justify-center text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {otherUser ? (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-2">
            <img
              src={otherUser.avatar_url || `https://ui-avatars.com/api/?name=${otherUser.username}&background=FF9933&color=000`}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-zinc-700"
            />
            <div>
              <p className="font-bold text-sm leading-none">{otherUser.display_name || otherUser.username}</p>
              <p className="text-zinc-500 text-xs mt-0.5">@{otherUser.username}</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse w-32" />
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
            <p className="text-sm">Koi message nahi — pehla message bhejein!</p>
          </div>
        ) : (
          msgs.map(msg => {
            const isMe = String(msg.sender_id) === String(currentUser.id);
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                  isMe
                    ? "bg-primary text-black rounded-br-sm font-medium"
                    : "bg-zinc-800 text-white rounded-bl-sm"
                )}>
                  <p>{msg.content}</p>
                  <p className={cn("text-xs mt-0.5", isMe ? "text-black/60" : "text-zinc-500")}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-900 flex-shrink-0 bg-zinc-950">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message likhein..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Send className="w-5 h-5 text-black ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
