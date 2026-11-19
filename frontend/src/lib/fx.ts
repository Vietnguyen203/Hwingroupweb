// Hiệu ứng màu sắc cho cửa hàng: pháo giấy (confetti) và "bay vào giỏ". Không phụ thuộc thư viện.
// Mọi hiệu ứng tự bỏ qua khi người dùng bật "giảm chuyển động" trong hệ điều hành.

/** Bảng màu thương hiệu + vài màu phụ cho vui mắt. */
const COLORS = ["#6c3bff", "#ff6b35", "#ffd23f", "#2fa84f", "#ff5fa2", "#22c3ee", "#d6360a"];

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Particle = {
  x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; color: string; round: boolean; life: number;
};

type BurstOptions = {
  count?: number;
  /** Độ rộng toả ra (độ, 360 = mọi hướng). */
  spread?: number;
  /** Hướng trung tâm (độ, 270 = thẳng lên). */
  angle?: number;
  /** Tốc độ bắn ban đầu. */
  power?: number;
  gravity?: number;
};

/** Bắn pháo giấy từ toạ độ (x, y) trên màn hình (px, theo viewport). */
export function confettiBurst(x: number, y: number, { count = 40, spread = 360, angle = 270, power = 9, gravity = 0.34 }: BurstOptions = {}) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const particles: Particle[] = Array.from({ length: count }, () => {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const v = power * (0.45 + Math.random() * 0.75);
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], round: Math.random() < 0.3,
      life: 70 + Math.random() * 40,
    };
  });

  let frame = 0;
  const tick = () => {
    frame += 1;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;
    for (const p of particles) {
      if (frame > p.life) continue;
      alive += 1;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.life - frame) / 25);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 2 + 1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (alive > 0) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/** Mưa pháo giấy ăn mừng (đặt hàng thành công): hai khẩu pháo ở hai góc dưới + một đợt rơi từ trên xuống. */
export function confettiShower() {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  confettiBurst(w * 0.08, h * 0.95, { count: 70, spread: 55, angle: 300, power: 17 });
  confettiBurst(w * 0.92, h * 0.95, { count: 70, spread: 55, angle: 240, power: 17 });
  setTimeout(() => {
    confettiBurst(w * 0.5, h * 0.25, { count: 60, spread: 360, power: 8, gravity: 0.25 });
  }, 350);
}

/**
 * Ảnh sản phẩm "bay" cong từ `source` (nút bấm) tới biểu tượng giỏ trên màn hình (phần tử có data-cart-target),
 * kết thúc bằng một chùm pháo giấy nhỏ và sự kiện "hwin:cart-added" (giỏ nảy số). Luôn resolve, kể cả khi không có hiệu ứng.
 */
export function flyToCart(source: Element | null, imageUrl?: string | null): Promise<void> {
  const done = () => {
    window.dispatchEvent(new CustomEvent("hwin:cart-added"));
  };
  const target = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]")).find((el) => el.getBoundingClientRect().width > 0);
  if (!source || !target || prefersReducedMotion() || typeof Element.prototype.animate !== "function") {
    done();
    return Promise.resolve();
  }

  const size = 56;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const sx = from.left + from.width / 2 - size / 2;
  const sy = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - size / 2 - sx;
  const dy = to.top + to.height / 2 - size / 2 - sy;
  const arc = Math.max(90, Math.abs(dy) * 0.4); // vòng lên trên rồi mới rơi vào giỏ

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText =
    `position:fixed;left:${sx}px;top:${sy}px;width:${size}px;height:${size}px;border-radius:16px;z-index:200;pointer-events:none;` +
    "box-shadow:0 10px 28px -6px rgba(255,107,53,.65),0 0 0 3px #fff,0 0 0 5px #6c3bff;" +
    (imageUrl ? `background:#fff url("${encodeURI(imageUrl)}") center/cover` : "background:linear-gradient(135deg,#6c3bff,#ff6b35)");
  document.body.appendChild(ghost);

  const animation = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - arc}px) scale(0.85) rotate(170deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(0.22) rotate(340deg)`, opacity: 0.85, offset: 1 },
    ],
    { duration: 720, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
  );

  return animation.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
      done();
      confettiBurst(to.left + to.width / 2, to.top + to.height / 2, { count: 22, power: 5.5, gravity: 0.22 });
    });
}
