"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";
import type { NotificationPage } from "@/lib/notifications";
import { useRealtime } from "@/stores/realtime-store";

const UNREAD_KEY = ["notifications", "unread"] as const;
const LIST_KEY = ["notifications", "list"] as const;
type Unread = { unread: number };

/** Số thông báo chưa đọc. Có WebSocket thì được đẩy tức thời; mất kết nối thì hỏi lại mỗi 60 giây. */
export function useUnreadCount(): number {
  const me = useMe().data;
  const connected = useRealtime((s) => s.connected);
  const q = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => api<Unread>("/api/notifications/unread-count"),
    enabled: !!me,
    refetchInterval: connected ? false : 60_000,
  });
  return me ? (q.data?.unread ?? 0) : 0;
}

/** Danh sách thông báo (mới nhất trước), tải thêm từng trang; chỉ tải khi bảng thông báo đang mở. */
export function useNotificationList(open: boolean) {
  const me = useMe().data;
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => api<NotificationPage>(`/api/notifications?page=${pageParam}&page_size=15`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: open && !!me,
    staleTime: 0,
  });
}

/** Đánh dấu đã đọc một thông báo / tất cả; cập nhật ngay danh sách và số chưa đọc. */
export function useMarkRead() {
  const qc = useQueryClient();

  const apply = (unread: number, only?: string) => {
    qc.setQueryData<Unread>(UNREAD_KEY, { unread });
    qc.setQueryData<InfiniteData<NotificationPage>>(LIST_KEY, (old) =>
      old && {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          content: p.content.map((n) => (only === undefined || n.id === only ? { ...n, read: true } : n)),
        })),
      },
    );
  };

  const one = useMutation({
    mutationFn: (id: string) => api<Unread>(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: (r, id) => apply(r.unread, id),
  });
  const all = useMutation({
    mutationFn: () => api<Unread>("/api/notifications/read-all", { method: "POST" }),
    onSuccess: (r) => apply(r.unread),
  });
  return { markRead: one.mutate, markAllRead: all.mutate, markingAll: all.isPending };
}
