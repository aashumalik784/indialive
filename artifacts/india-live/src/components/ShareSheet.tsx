import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy, X, MoreHorizontal, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  url: string;
  caption?: string;
};

type App = {
  name: string;
  color: string;
  bg: string;
  getUrl?: (url: string, text: string) => string;
  action?: (url: string, text: string) => void;
  icon: React.ReactNode;
};

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.004 2C6.478 2 2 6.477 2 12.001c0 1.777.465 3.448 1.28 4.896L2 22l5.263-1.27A9.953 9.953 0 0012.004 22C17.53 22 22 17.522 22 12.001 22 6.477 17.53 2 12.004 2zm0 18.154a8.144 8.144 0 01-4.194-1.16l-.3-.179-3.125.755.784-2.978-.195-.307A8.118 8.118 0 013.85 12c0-4.495 3.659-8.154 8.154-8.154 4.496 0 8.154 3.659 8.154 8.154 0 4.496-3.658 8.154-8.154 8.154z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function SnapchatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.229-3.651.302-4.847C7.788 1.07 11.111.793 12.206.793z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function ShareSheetApp({ name, color, bg, icon, onClick }: {
  name: string; color: string; bg: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-90 transition-transform select-none"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", bg, color)}>
        {icon}
      </div>
      <span className="text-white text-xs font-medium text-center leading-tight w-16 truncate">{name}</span>
    </button>
  );
}

export default function ShareSheet({ open, onClose, url, caption = "" }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const shareText = caption ? `${caption}\n` : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText + url);

  const openLink = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy nahi ho saka", description: url });
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: caption || "India Live", url });
      onClose();
    } catch {}
  };

  const apps = [
    {
      name: "WhatsApp",
      bg: "bg-[#25D366]",
      color: "text-white",
      icon: <WhatsAppIcon />,
      onClick: () => openLink(`https://api.whatsapp.com/send?text=${encodedText}`),
    },
    {
      name: "Telegram",
      bg: "bg-[#2AABEE]",
      color: "text-white",
      icon: <TelegramIcon />,
      onClick: () => openLink(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`),
    },
    {
      name: "Instagram",
      bg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
      color: "text-white",
      icon: <InstagramIcon />,
      onClick: async () => {
        await navigator.clipboard.writeText(url).catch(() => {});
        toast({ title: "Link copy ho gaya!", description: "Ab Instagram par paste karein" });
        onClose();
      },
    },
    {
      name: "Facebook",
      bg: "bg-[#1877F2]",
      color: "text-white",
      icon: <FacebookIcon />,
      onClick: () => openLink(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      name: "Twitter / X",
      bg: "bg-black border border-zinc-700",
      color: "text-white",
      icon: <TwitterXIcon />,
      onClick: () => openLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`),
    },
    {
      name: "Snapchat",
      bg: "bg-[#FFFC00]",
      color: "text-black",
      icon: <SnapchatIcon />,
      onClick: () => openLink(`https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`),
    },
    {
      name: "YouTube",
      bg: "bg-[#FF0000]",
      color: "text-white",
      icon: <YoutubeIcon />,
      onClick: () => openLink(`https://www.youtube.com/`),
    },
    {
      name: "Aur Apps",
      bg: "bg-zinc-800",
      color: "text-white",
      icon: <MoreHorizontal className="w-7 h-7" />,
      onClick: handleNativeShare,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-3xl border-t border-zinc-800 pb-safe">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-white font-bold text-lg">Share Karein</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center active:bg-zinc-700"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Video link preview */}
        <div className="mx-5 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-zinc-400 text-xs mb-0.5 font-semibold uppercase tracking-wide">Video Link</p>
            <p className="text-white text-sm truncate">{url}</p>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              copied ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-300 active:bg-zinc-700"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* WhatsApp prominent button */}
        <div className="px-5 pb-4">
          <button
            onClick={() => openLink(`https://api.whatsapp.com/send?text=${encodedText}`)}
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bc5a] active:scale-[0.98] transition-all rounded-2xl py-4 shadow-lg shadow-[#25D366]/20"
          >
            <WhatsAppIcon />
            <span className="text-white font-bold text-base">WhatsApp par Share Karein</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-5 mb-4">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs font-semibold">Ya inn par share karein</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Other apps grid — skip WhatsApp since it has its own button */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-4 gap-4">
            {apps.filter(a => a.name !== "WhatsApp").map((app) => (
              <ShareSheetApp
                key={app.name}
                name={app.name}
                bg={app.bg}
                color={app.color}
                icon={app.icon}
                onClick={app.onClick}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
