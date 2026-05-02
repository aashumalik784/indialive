import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type User = {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  video_count: number;
  created_at: string;
};

export type Video = {
  id: string;
  user_id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  caption: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  liked_by_user: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  video_id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  content: string;
  created_at: string;
};

export function useVideos(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ["videos", page, perPage],
    queryFn: async () => {
      const res = await apiRequest(`/api/videos?page=${page}&per_page=${perPage}`);
      return res.json() as Promise<{
        videos: Video[];
        total: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
      }>;
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

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      const res = await apiRequest(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      return res.json() as Promise<{ comment: Comment }>;
    },
    onSuccess: (data, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", videoId, "comments"] });
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
        return {
          ...old,
          video: {
            ...old.video,
            liked_by_user: data.liked,
            like_count: data.like_count,
          },
        };
      });
      queryClient.setQueriesData({ queryKey: ["videos"] }, (old: any) => {
        if (!old?.videos) return old;
        return {
          ...old,
          videos: old.videos.map((v: any) =>
            String(v.id) === String(videoId)
              ? { ...v, liked_by_user: data.liked, like_count: data.like_count }
              : v
          ),
        };
      });
    },
  });
}
