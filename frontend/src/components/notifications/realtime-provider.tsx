"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { showToast } from "@/components/ui/toast";
import { useMe } from "@/hooks/use-me";
import { useUnreadCount } from "@/hooks/use-notifications";
import { playNotificationSound, unlockAudio } from "@/lib/notification-sound";
import { describeNotification, queryKeysToRefresh, type RealtimeMessage } from "@/lib/notifications";
import { useRealtime } from "@/stores/realtime-store";

const PING_MS = 30_000;
const RETRY_MAX_MS = 30_000;

/**
 * Kênh thời gian thực cho người dùng đang đăng nhập (đặt một lần ở gốc ứng dụng, không hiển thị gì):
 * - Mở WebSocket /api/realtime (cùng tên miền nên dùng cookie đăng nhập), mất kết nối thì tự nối lại có giãn cách.
 * - Có thông báo mới: cập nhật số chưa đọc, phát âm báo, hiện toast, tải lại dữ liệu trang đang mở liên quan.
 * - Số chưa đọc hiện trên tiêu đề tab: "(3) Đơn hàng | HWIN".
 */
export function RealtimeProvider() {
  const me = useMe().data;
  const qc = useQueryClient();
  const userId = me?.id ?? null;
  const unread = useUnreadCount();

  // Nạp lựa chọn bật/tắt tiếng đã lưu; mở khóa âm thanh ở lần thao tác đầu tiên (trình duyệt yêu cầu)
  useEffect(() => {
    useRealtime.getState().loadSound();
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Kết nối WebSocket theo người dùng hiện tại
  useEffect(() => {
    if (!userId) return;
    const { setConnected } = useRealtime.getState();
    let ws: WebSocket | null = null;
    let closed = false;
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;

    const handle = (msg: RealtimeMessage) => {
      if (msg.type === "hello") {
        // (Kết nối lại) có thể đã lỡ thông báo trong lúc mất kết nối -> hỏi lại
        void qc.invalidateQueries({ queryKey: ["notifications"] });
      } else if (msg.type === "unread") {
        qc.setQueryData(["notifications", "unread"], { unread: msg.unreadCount });
        void qc.invalidateQueries({ queryKey: ["notifications", "list"] });
      } else if (msg.type === "notification") {
        const n = msg.notification;
        qc.setQueryData(["notifications", "unread"], { unread: msg.unreadCount });
        void qc.invalidateQueries({ queryKey: ["notifications", "list"] });
        queryKeysToRefresh(n).forEach((queryKey) => void qc.invalidateQueries({ queryKey }));
        const { title, body } = describeNotification(n);
        showToast({ type: "info", title, message: body || title });
        playNotificationSound(useRealtime.getState().soundEnabled);
      }
    };

    const connect = () => {
      const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
      let opened = false;
      const socket = new WebSocket(`${scheme}//${window.location.host}/api/realtime`);
      ws = socket;
      socket.onopen = () => {
        opened = true;
        attempt = 0;
        setConnected(true);
        ping = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send("ping"), PING_MS);
      };
      socket.onmessage = (ev) => {
        try {
          handle(JSON.parse(ev.data as string) as RealtimeMessage);
        } catch {
          // tin không đúng định dạng: bỏ qua
        }
      };
      socket.onclose = () => {
        clearInterval(ping);
        setConnected(false);
        if (closed) return;
        // Chưa vào được (thường do access token hết hạn): một lời gọi REST sẽ tự làm mới phiên rồi nối lại lần sau
        if (!opened) void qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
        attempt += 1;
        retry = setTimeout(connect, Math.min(RETRY_MAX_MS, 1000 * 2 ** Math.min(attempt, 5)));
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      ws?.close();
      setConnected(false);
    };
  }, [userId, qc]);

  // Số chưa đọc trên tiêu đề tab (giữ đúng cả khi Next đổi tiêu đề lúc chuyển trang)
  useEffect(() => {
    const strip = (t: string) => t.replace(/^\(\d+\+?\)\s/, "");
    const apply = () => {
      const base = strip(document.title);
      const next = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const el = document.querySelector("title");
    if (!el) return;
    const observer = new MutationObserver(apply);
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      document.title = strip(document.title);
    };
  }, [unread]);

  return null;
}
