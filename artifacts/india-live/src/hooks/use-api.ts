import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type User = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  video_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  created_at: string;
};

export type Video = {
  id: string;
  user_id: string;
  author: { id: string; username: string; avatar_url?: string };
  caption: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  liked_by_user: boolean;
  bookmarked_by_user?: boolean;
  duet_of?: number | null;
  stitch_of?: number | null;
  sound_of?: number | null;
  privacy?: string;
  pinned?: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  video_id: string;
  author: { id: string; username: string; avatar_url?: string };
  content: string;
  reply_to?: string | null;
  like_count: number;
  liked_by_user: boolean;
  reply_count: number;
  created_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  author: { id: string; username: string; avatar_url?: string };
  media_url: string;
  media_type: string;
  caption?: string;
  expires_at: string;
  view_count: number;
  created_at: string;
};

export type StoryGroup = {
  user: { id: string; username: string; avatar_url?: string };
  stories: Story[];
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender: { id: string; username: string; avatar_url?: string };
  content: string;
  read: boolean;
  created_at: string;
};

export type Conversation = {
  user: { id: string; username: string; avatar_url?: string; display_name: string };
  last_message: Message;
  unread_count: number;
};

// ── Videos ──────────────────────────────────────────────────────────────────

export function useVideos(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ["videos", page, perPage],
    queryFn: async () => {
      const res = await apiRequest(`/api/videos?page=${page}&per_page=${perPage}`);
      return res.json() as Promise<{ videos: Video[]; total: number; pages: number; has_next: boolean; has_prev: boolean }>;
    },
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: async () => {
      const res = await apiRequest(`/api/videos/${id}`);
      return res.json() as Promise<{ video: Video }>;
    },
    enabled: !!id,
  });
}

export function useUserVideos(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "videos"],
    queryFn: async () => {
      const res = await apiRequest(`/api/users/${userId}/videos`);
      return res.json() as Promise<{ videos: Video[]; total: number }>;
    },
    enabled: !!userId,
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["users", username],
    queryFn: async () => {
      const res = await apiRequest(`/api/users/${username}`);
      return res.json() as Promise<{ user: User }>;
    },
    enabled: !!username,
  });
}

export function useFollowingFeed(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ["feed", "following", page],
    queryFn: async () => {
      const res = await apiRequest(`/api/feed/following?page=${page}&per_page=${perPage}`);
      return res.json() as Promise<{ videos: Video[]; total: number; has_next: boolean }>;
    },
  });
}

export function useLikeVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest(`/api/videos/${videoId}/like`, { method: "POST" });
      return res.json() as Promise<{ liked: boolean; like_count: number }>;
    },
    onSuccess: (data, videoId) => {
      queryClient.setQueryData(["video", videoId], (old: any) => {
        if (!old?.video) return old;
        return { ...old, video: { ...old.video, liked_by_user: data.liked, like_count: data.like_count } };
      });
      queryClient.setQueriesData({ queryKey: ["videos"] }, (old: any) => {
        if (!old?.videos) return old;
        return { ...old, videos: old.videos.map((v: any) => String(v.id) === String(videoId) ? { ...v, liked_by_user: data.liked, like_count: data.like_count } : v) };
      });
    },
  });
}

// ── Comments ─────────────────────────────────────────────────────────────────

export function useComments(videoId: string) {
  return useQuery({
    queryKey: ["videos", videoId, "comments"],
    queryFn: async () => {
      const res = await apiRequest(`/api/videos/${videoId}/comments`);
      return res.json() as Promise<{ comments: Comment[]; total: number }>;
    },
    enabled: !!videoId,
  });
}

export function useCommentReplies(videoId: string, commentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["videos", videoId, "comments", commentId, "replies"],
    queryFn: async () => {
      const res = await apiRequest(`/api/videos/${videoId}/comments?reply_to=${commentId}`);
      return res.json() as Promise<{ comments: Comment[]; total: number }>;
    },
    enabled: enabled && !!commentId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, content, replyTo }: { videoId: string; content: string; replyTo?: string }) => {
      const res = await apiRequest(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, reply_to: replyTo || null }),
      });
      return res.json() as Promise<{ comment: Comment }>;
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", videoId, "comments"] });
    },
  });
}

export function useLikeComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest(`/api/comments/${commentId}/like`, { method: "POST" });
      return res.json() as Promise<{ liked: boolean; like_count: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

// ── Follow ────────────────────────────────────────────────────────────────────

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest(`/api/users/${username}/follow`, { method: "POST" });
      return res.json() as Promise<{ is_following: boolean; follower_count: number }>;
    },
    onSuccess: (data, username) => {
      queryClient.setQueriesData({ queryKey: ["users", username] }, (old: any) => {
        if (!old?.user) return old;
        return { ...old, user: { ...old.user, is_following: data.is_following, follower_count: data.follower_count } };
      });
      queryClient.invalidateQueries({ queryKey: ["feed", "following"] });
    },
  });
}

export function useUserFollowers(username: string) {
  return useQuery({
    queryKey: ["users", username, "followers"],
    queryFn: async () => {
      const res = await apiRequest(`/api/users/${username}/followers`);
      return res.json() as Promise<{ users: User[]; total: number }>;
    },
    enabled: !!username,
  });
}

export function useUserFollowing(username: string) {
  return useQuery({
    queryKey: ["users", username, "following"],
    queryFn: async () => {
      const res = await apiRequest(`/api/users/${username}/following`);
      return res.json() as Promise<{ users: User[]; total: number }>;
    },
    enabled: !!username,
  });
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await apiRequest("/api/bookmarks");
      return res.json() as Promise<{ videos: Video[]; total: number }>;
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest(`/api/videos/${videoId}/bookmark`, { method: "POST" });
      return res.json() as Promise<{ bookmarked: boolean }>;
    },
    onSuccess: (data, videoId) => {
      queryClient.setQueryData(["video", videoId], (old: any) => {
        if (!old?.video) return old;
        return { ...old, video: { ...old.video, bookmarked_by_user: data.bookmarked } };
      });
      queryClient.setQueriesData({ queryKey: ["videos"] }, (old: any) => {
        if (!old?.videos) return old;
        return { ...old, videos: old.videos.map((v: any) => String(v.id) === String(videoId) ? { ...v, bookmarked_by_user: data.bookmarked } : v) };
      });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

// ── Stories ───────────────────────────────────────────────────────────────────

export function useStories() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const res = await apiRequest("/api/stories");
      return res.json() as Promise<{ story_groups: StoryGroup[] }>;
    },
    refetchInterval: 60_000,
  });
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: ["stories", "user", userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/stories/user/${userId}`);
      return res.json() as Promise<{ stories: Story[] }>;
    },
    enabled: !!userId,
  });
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await apiRequest("/api/messages/conversations");
      return res.json() as Promise<{ conversations: Conversation[] }>;
    },
    refetchInterval: 10_000,
  });
}

export function useMessages(otherUserId: string) {
  return useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const res = await apiRequest(`/api/messages/${otherUserId}`);
      return res.json() as Promise<{ messages: Message[] }>;
    },
    enabled: !!otherUserId,
    refetchInterval: 5_000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ otherUserId, content }: { otherUserId: string; content: string }) => {
      const res = await apiRequest(`/api/messages/${otherUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      return res.json() as Promise<{ message: Message }>;
    },
    onSuccess: (_, { otherUserId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-messages"],
    queryFn: async () => {
      const res = await apiRequest("/api/messages/unread-count");
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 15_000,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useAnalytics(username: string) {
  return useQuery({
    queryKey: ["analytics", username],
    queryFn: async () => {
      const res = await apiRequest(`/api/users/${username}/analytics`);
      return res.json() as Promise<{
        total_views: number;
        total_likes: number;
        total_comments: number;
        follower_count: number;
        following_count: number;
        video_count: number;
        videos: { id: string; caption: string; thumbnail_url: string; view_count: number; like_count: number; comment_count: number; created_at: string }[];
      }>;
    },
    enabled: !!username,
  });
}

// ── Social (block, pin) ───────────────────────────────────────────────────────

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest(`/api/videos/${videoId}/pin`, { method: "POST" });
      return res.json() as Promise<{ pinned: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleBlock() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest(`/api/users/${userId}/block`, { method: "POST" });
      return res.json() as Promise<{ blocked: boolean }>;
    },
  });
}
