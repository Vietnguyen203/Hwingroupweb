import { create } from "zustand";

import { readSoundEnabled, writeSoundEnabled } from "@/lib/notification-sound";

type RealtimeState = {
  /** WebSocket đang mở. Khi mất kết nối, số chưa đọc được hỏi lại định kỳ qua REST. */
  connected: boolean;
  setConnected: (connected: boolean) => void;
  /** Âm báo bật / tắt (nhớ trên trình duyệt). Mặc định bật; giá trị thật được nạp sau khi trang hydrate. */
  soundEnabled: boolean;
  loadSound: () => void;
  toggleSound: () => void;
};

export const useRealtime = create<RealtimeState>((set, get) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
  soundEnabled: true,
  loadSound: () => set({ soundEnabled: readSoundEnabled() }),
  toggleSound: () => {
    const next = !get().soundEnabled;
    writeSoundEnabled(next);
    set({ soundEnabled: next });
  },
}));
