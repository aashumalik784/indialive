import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Story, StoryGroup } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api";

interface Props {
  groups: StoryGroup[];
  startGroupIndex: number;
  startStoryIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

export default function StoriesViewer({ groups, startGroupIndex, startStoryIndex, onClose }: Props) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [storyIdx, setStoryIdx] = useState(startStoryIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  useEffect(() => {
    if (!story) { onClose(); return; }
    // Mark viewed
    apiRequest(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});
  }, [story?.id]);

  useEffect(() => {
    if (paused) { clearInterval(timerRef.current!); return; }
    setProgress(0);
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 50;
      setProgress(Math.min(100, (elapsed / STORY_DURATION) * 100));
      if (elapsed >= STORY_DURATION) advance();
    }, 50);
    return () => clearInterval(timerRef.current!);
  }, [storyIdx, groupIdx, paused]);

  const advance = () => {
    const currentGroup = groups[groupIdx];
    if (storyIdx + 1 < currentGroup.stories.length) {
      setStoryIdx(s => s + 1);
    } else if (groupIdx + 1 < groups.length) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(groups[groupIdx - 1].stories.length - 1);
    }
  };

  if (!group || !story) return null;

  const isVideo = story.media_type === "video";
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (h > 0) return `${h}h pehle`;
    if (m > 0) return `${m}m pehle`;
    return "abhi";
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onPointerDown={e => { e.preventDefault(); setPaused(true); }} onPointerUp={() => setPaused(false)}>
      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <img
            src={group.user.avatar_url || `https://ui-avatars.com/api/?name=${group.user.username}&background=FF9933&color=000`}
            alt=""
            className="w-9 h-9 rounded-full border border-white/40 object-cover"
          />
          <div>
            <p className="text-white text-sm font-bold leading-none">@{group.user.username}</p>
            <p className="text-white/60 text-xs mt-0.5">{timeAgo(story.created_at)}</p>
          </div>
        </div>
        <button className="pointer-events-auto" onClick={onClose}>
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Media */}
      {isVideo ? (
        <video
          ref={videoRef}
          key={story.id}
          src={story.media_url}
          autoPlay
          playsInline
          muted={false}
          loop
          className="w-full h-full object-contain"
        />
      ) : (
        <img key={story.id} src={story.media_url} alt="" className="w-full h-full object-contain" />
      )}

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-16 left-0 right-0 px-5">
          <p className="text-white text-sm font-semibold drop-shadow-lg text-center">{story.caption}</p>
        </div>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 flex pointer-events-auto">
        <div className="flex-1" onClick={goBack} />
        <div className="flex-1" onClick={advance} />
      </div>

      {/* Group navigation */}
      {groupIdx > 0 && (
        <button className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center" onClick={goBack}>
          <ChevronLeft className="w-6 h-6 text-white/60" />
        </button>
      )}
      {groupIdx < groups.length - 1 && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center" onClick={advance}>
          <ChevronRight className="w-6 h-6 text-white/60" />
        </button>
      )}
    </div>
  );
}
