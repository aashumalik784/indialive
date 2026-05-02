import { useRef, useState } from "react";
import { useStories } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { Plus } from "lucide-react";
import type { StoryGroup } from "@/hooks/use-api";

interface Props {
  onViewStories: (group: StoryGroup, index: number) => void;
}

export default function StoriesBar({ onViewStories }: Props) {
  const { data } = useStories();
  const { currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const groups = data?.story_groups || [];

  if (!currentUser && groups.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 px-3 py-2 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Your Story button */}
      {currentUser && (
        <Link href="/stories/create" className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-lg font-bold">{currentUser.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-black flex items-center justify-center">
              <Plus className="w-3 h-3 text-black" />
            </div>
          </div>
          <span className="text-xs text-zinc-400 truncate w-14 text-center">Aapki</span>
        </Link>
      )}

      {/* Story groups */}
      {groups.map((group, idx) => (
        <button
          key={group.user.id}
          className="flex flex-col items-center gap-1 flex-shrink-0"
          onClick={() => onViewStories(group, 0)}
        >
          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-primary via-orange-400 to-green-500">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-zinc-900">
              <img
                src={group.user.avatar_url || `https://ui-avatars.com/api/?name=${group.user.username}&background=FF9933&color=000`}
                alt={group.user.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="text-xs text-zinc-300 truncate w-14 text-center">@{group.user.username}</span>
        </button>
      ))}
    </div>
  );
}
