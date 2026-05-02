import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdCard() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div className="h-[100dvh] w-full snap-start relative bg-zinc-950 flex items-center justify-center overflow-hidden">
      <div className="absolute top-3 right-3 bg-zinc-800/80 text-zinc-500 text-[10px] px-2 py-0.5 rounded font-medium">
        Ad
      </div>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: "250px" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
