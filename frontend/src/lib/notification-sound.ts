/**
 * Âm báo thông báo: hai nốt "ding-dong" tạo bằng Web Audio (không cần tệp âm thanh).
 * Trình duyệt chặn âm thanh tới khi người dùng bấm / gõ phím ít nhất một lần trên trang; `unlockAudio()` lo việc đó.
 */
const STORAGE_KEY = "hwin:notify-sound";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

/** Gọi khi có thao tác của người dùng để trình duyệt cho phép phát âm thanh sau này. */
export function unlockAudio() {
  const c = context();
  if (c && c.state === "suspended") void c.resume().catch(() => undefined);
}

/** Người dùng đã tắt tiếng chưa (lưu trên trình duyệt; mặc định bật). */
export function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // trình duyệt chặn localStorage: bỏ qua, chỉ không nhớ lựa chọn
  }
}

function tone(c: AudioContext, freq: number, start: number, duration: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Phát âm báo (không làm gì nếu người dùng đã tắt tiếng hoặc trình duyệt chưa cho phép). */
export function playNotificationSound(enabled: boolean) {
  if (!enabled) return;
  const c = context();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => undefined);
  if (c.state !== "running") return; // chưa được phép phát
  const t = c.currentTime;
  tone(c, 880, t, 0.2); // A5
  tone(c, 1318.5, t + 0.14, 0.36); // E6
}
