"use client";

import { useEffect, useRef, useState } from "react";
import { useShop } from "./shop-provider";

/**
 * Opening animation. A real rose photograph slowly zooms in the background while
 * realistic rose petals (procedural: cupped, veined, grain, soft shadows, depth
 * blur, 3D tumbling with light/shade) drift down on the wind and gather on the floor.
 */

const HERO = "https://images.unsplash.com/photo-1589458456444-f7158a7e8a4f?auto=format&fit=crop&w=1100&q=75";

// [base (darkest, near the claw), body, edge highlight]
const ROSE_TONES: [string, string, string][] = [
  ["#5e0a17", "#a5142b", "#d23a4f"], // deep red
  ["#6d0d1c", "#b81d34", "#e0525f"], // red
  ["#8f2440", "#cf5f7c", "#f2a6b6"], // rose pink
  ["#a24a62", "#e494a8", "#fbd3dc"], // soft pink
  ["#b77d78", "#ecc7bd", "#fff1ea"], // blush
  ["#b9a99d", "#f1e7de", "#fffaf6"], // cream white
];
const WEIGHTS = [3, 3, 3, 2, 1.5, 1];

type Sprite = { front: HTMLCanvasElement; back: HTMLCanvasElement; w: number; h: number };

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/** Outline of a rose petal: narrow claw at the bottom, broad wavy top with a soft notch. */
function petalOutline(w: number, h: number): [number, number][] {
  const pts: [number, number][] = [];
  const seedL = Array.from({ length: 6 }, () => rnd(-1, 1));
  const seedR = Array.from({ length: 6 }, () => rnd(-1, 1));
  const notch = rnd(0.02, 0.07) * h;
  const widest = rnd(0.55, 0.72);
  const prof = (s: number) => {
    const a = Math.pow(Math.sin(Math.PI * Math.min(1, s / (widest * 2))), 0.7);
    const top = s > widest ? Math.pow(1 - (s - widest) / (1 - widest), 0.55) : 1;
    return Math.max(0.06, a * top);
  };
  const wobble = (seed: number[], s: number) =>
    1 + seed.reduce((acc, k, i) => acc + k * 0.025 * Math.sin((i + 2) * Math.PI * s + k), 0);
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    pts.push([(w / 2) * prof(s) * wobble(seedR, s), h / 2 - s * h + (s > 0.92 ? notch * ((s - 0.92) / 0.08) : 0)]);
  }
  for (let i = N; i >= 0; i--) {
    const s = i / N;
    pts.push([-(w / 2) * prof(s) * wobble(seedL, s), h / 2 - s * h + (s > 0.92 ? notch * ((s - 0.92) / 0.08) : 0)]);
  }
  return pts;
}

function tracePath(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function drawPetal(ctx: CanvasRenderingContext2D, pts: [number, number][], w: number, h: number, tone: [string, string, string], back: boolean) {
  const [base, body, edge] = tone;
  tracePath(ctx, pts);
  ctx.save();
  // soft cast shadow (gives the petal weight against the background)
  ctx.shadowColor = "rgba(60, 10, 20, 0.28)";
  ctx.shadowBlur = h * 0.18;
  ctx.shadowOffsetY = h * 0.08;
  const g = ctx.createLinearGradient(0, h / 2, 0, -h / 2);
  g.addColorStop(0, base);
  g.addColorStop(0.35, body);
  g.addColorStop(1, back ? body : edge);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  ctx.save();
  tracePath(ctx, pts);
  ctx.clip();
  // cupping: one side turns away from the light
  const cup = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  cup.addColorStop(0, "rgba(40, 0, 10, 0.32)");
  cup.addColorStop(0.45, "rgba(40, 0, 10, 0)");
  cup.addColorStop(0.7, "rgba(255, 255, 255, 0.10)");
  cup.addColorStop(1, "rgba(40, 0, 10, 0.18)");
  ctx.fillStyle = cup;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  // velvet sheen near the top edge
  const sheen = ctx.createRadialGradient(w * 0.12, -h * 0.28, 1, w * 0.12, -h * 0.28, h * 0.55);
  sheen.addColorStop(0, back ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.28)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  // veins fanning out from the claw
  ctx.lineWidth = 0.45;
  for (let i = 0; i < 13; i++) {
    const a = (i / 12 - 0.5) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.quadraticCurveTo(Math.sin(a) * w * 0.25, h * 0.05, Math.sin(a) * w * 0.5, -h / 2);
    ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.07)" : "rgba(60,0,15,0.08)";
    ctx.stroke();
  }
  // grain
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(50,0,10,0.06)";
    ctx.fillRect(rnd(-w / 2, w / 2), rnd(-h / 2, h / 2), 0.7, 0.7);
  }
  // darker claw where the petal was attached
  const claw = ctx.createRadialGradient(0, h / 2, 0, 0, h / 2, h * 0.32);
  claw.addColorStop(0, "rgba(40, 10, 0, 0.35)");
  claw.addColorStop(1, "rgba(40, 10, 0, 0)");
  ctx.fillStyle = claw;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  if (back) {
    ctx.fillStyle = "rgba(255, 245, 245, 0.10)";
    ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore();

  // thin translucent rim
  tracePath(ctx, pts);
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.stroke();
}

function makeSprite(dpr: number, tone: [string, string, string], w: number, h: number, blur: number): Sprite {
  const pad = Math.ceil(h * 0.45 + blur * 3);
  const pts = petalOutline(w, h);
  const make = (back: boolean) => {
    const c = document.createElement("canvas");
    c.width = Math.ceil((w + pad * 2) * dpr);
    c.height = Math.ceil((h + pad * 2) * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.translate(w / 2 + pad, h / 2 + pad);
    if (blur > 0 && "filter" in ctx) ctx.filter = `blur(${blur}px)`;
    drawPetal(ctx, pts, w, h, tone, back);
    return c;
  };
  return { front: make(false), back: make(true), w: w + pad * 2, h: h + pad * 2 };
}

type P = {
  s: Sprite; x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; tilt: number; vtilt: number; spin: number; vspin: number;
  scale: number; depth: number; rest: boolean; alpha: number;
};

export function PetalSplash() {
  const { catalog, haptic, t } = useShop();
  const [phase, setPhase] = useState<"in" | "leaving" | "gone">("in");
  const [reduced, setReduced] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(performance.now());
  const leaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      if (sessionStorage.getItem("roses_splash") === "1") setPhase("gone");
      else sessionStorage.setItem("roses_splash", "1");
    } catch { /* ignore */ }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const img = new Image();
    img.onload = () => setPhotoReady(true);
    img.src = HERO;
    new Image().src = "/roses-emblem.webp";
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("splash-lock", phase !== "gone");
  }, [phase]);

  useEffect(() => {
    if (phase !== "in") return;
    const leave = () => {
      setPhase((p) => (p === "in" ? "leaving" : p));
      setTimeout(() => setPhase("gone"), 900);
    };
    leaveRef.current = leave;
    const minTime = reduced ? 800 : 4600;
    const wait = Math.max(0, minTime - (performance.now() - started.current));
    const timer = setTimeout(() => catalog && leave(), wait);
    const hard = setTimeout(leave, 8000);
    return () => { clearTimeout(timer); clearTimeout(hard); };
  }, [catalog, reduced, phase]);

  useEffect(() => {
    if (reduced || phase === "gone") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const pickTone = () => {
      const total = WEIGHTS.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < WEIGHTS.length; i++) if ((r -= WEIGHTS[i]) <= 0) return ROSE_TONES[i];
      return ROSE_TONES[0];
    };
    // Pre-rendered sprites for three depth layers (far and near are out of focus).
    const layers = {
      far: Array.from({ length: 10 }, () => makeSprite(dpr, pickTone(), rnd(14, 20), rnd(17, 24), 1.4)),
      mid: Array.from({ length: 18 }, () => makeSprite(dpr, pickTone(), rnd(26, 38), rnd(30, 46), 0)),
      near: Array.from({ length: 6 }, () => makeSprite(dpr, pickTone(), rnd(40, 54), rnd(48, 64), 3.5)),
    };
    const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

    const COLS = Math.ceil(W / 5);
    const heap = new Float32Array(COLS);
    const parts: P[] = [];
    const spawn = (x: number, y: number, vx: number, vy: number, layer: "far" | "mid" | "near"): P => ({
      s: pick(layers[layer]), x, y, vx, vy,
      rot: rnd(0, Math.PI * 2), vr: rnd(-1.4, 1.4),
      tilt: rnd(0, Math.PI * 2), vtilt: rnd(1.2, 3.4) * (Math.random() < 0.5 ? -1 : 1),
      spin: rnd(0, Math.PI * 2), vspin: rnd(0.6, 2),
      scale: layer === "far" ? rnd(0.8, 1) : rnd(0.85, 1.15),
      depth: layer === "far" ? 0.55 : layer === "mid" ? 1 : 1.7,
      rest: false,
      alpha: layer === "far" ? 0.78 : layer === "near" ? 0.9 : 1,
    });
    const layerOf = (): "far" | "mid" | "near" => {
      const r = Math.random();
      return r < 0.3 ? "far" : r < 0.93 ? "mid" : "near";
    };

    // A soft toss from behind the logo, then a steady fall from above.
    for (let i = 0; i < 46; i++) {
      const a = rnd(-Math.PI * 0.92, -Math.PI * 0.08);
      const sp = rnd(160, 520);
      parts.push(spawn(W / 2 + rnd(-30, 30), H * 0.42 + rnd(-20, 20), Math.cos(a) * sp, Math.sin(a) * sp, layerOf()));
    }
    let emitted = 0;
    const TOTAL_RAIN = 300;
    let last = performance.now();
    const t0 = last;
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const time = (now - t0) / 1000;
      const target = Math.min(TOTAL_RAIN, Math.floor((time / 2.2) * TOTAL_RAIN));
      for (; emitted < target; emitted++) {
        parts.push(spawn(rnd(-30, W + 30), rnd(-80, -20), rnd(-20, 20), rnd(30, 90), layerOf()));
      }
      const wind = Math.sin(time * 0.9) * 22 + Math.sin(time * 2.3 + 1) * 9;

      ctx.clearRect(0, 0, W, H);
      parts.sort((a, b) => a.depth - b.depth);
      for (const p of parts) {
        if (!p.rest) {
          p.tilt += p.vtilt * dt;
          p.spin += p.vspin * dt;
          // a petal seen edge-on falls faster; a flat one glides and drifts (flutter)
          const face = Math.abs(Math.cos(p.tilt));
          p.vy += 560 * p.depth * dt * (0.35 + 0.65 * (1 - face));
          p.vx += (Math.sin(p.tilt) * 70 * face + (wind - p.vx) * 0.9) * dt;
          p.vx *= 0.985;
          p.vy *= 0.975;
          const terminal = (170 + 150 * (1 - face)) * p.depth + 40;
          if (p.vy > terminal) p.vy += (terminal - p.vy) * 0.12;
          p.x += p.vx * dt * p.depth;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;

          if (p.depth <= 1) {
            const col = Math.max(0, Math.min(COLS - 1, (p.x / 5) | 0));
            const size = p.s.h * p.scale * 0.3;
            const floor = H - heap[col] - size * 0.25 - (p.depth < 1 ? 26 : 0);
            if (p.vy > 0 && p.y >= floor) {
              p.y = floor;
              p.rest = true;
              p.tilt = rnd(-0.9, 0.9); // lands almost flat, slightly turned
              const spread = Math.ceil((p.s.w * p.scale * 0.28) / 5);
              for (let k = -spread; k <= spread; k++) {
                const c = col + k;
                if (c >= 0 && c < COLS) heap[c] += size * 0.42 * (1 - Math.abs(k) / (spread + 1));
              }
            }
          } else if (p.y > H + 80) {
            p.alpha = 0;
          }
        }
        if (p.alpha <= 0) continue;
        const cosT = Math.cos(p.tilt);
        const sx = Math.max(0.12, Math.abs(cosT));
        const sy = 0.78 + 0.22 * Math.abs(Math.cos(p.spin));
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.scale * sx, p.scale * sy);
        ctx.drawImage(cosT >= 0 ? p.s.front : p.s.back, -p.s.w / 2, -p.s.h / 2, p.s.w, p.s.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const tick = setTimeout(() => haptic("tap"), 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(tick); };
    // keep running through "leaving"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, phase === "gone"]);

  if (phase === "gone") return null;
  const leaving = phase === "leaving";

  return (
    <div
      className={`splash fixed inset-0 z-[100] overflow-hidden ${leaving ? "splash-out" : ""}`}
      onClick={() => leaveRef.current()}
      role="status"
      aria-label={t("loading")}
    >
      <div
        className={`splash-photo absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${photoReady ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${HERO})` }}
        aria-hidden
      />
      <div className="splash-veil absolute inset-0" aria-hidden />
      {!reduced ? <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden /> : null}
      <div className={`pointer-events-none absolute inset-0 grid place-items-center ${leaving ? "splash-logo-out" : ""}`}>
        <div className="flex flex-col items-center" style={{ transform: "translateY(-6vh)" }}>
          <img
            src="/roses-emblem.webp"
            alt=""
            width={150}
            height={150}
            className="splash-mark h-[150px] w-[150px] rounded-full shadow-[0_28px_60px_-24px_rgb(30_61_46/0.75)]"
          />
          <p className="splash-word mt-5 font-display text-[58px] leading-none font-bold tracking-tight text-ink">Roses</p>
          <p className="splash-tag mt-2 text-[12px] font-bold tracking-[0.34em] text-accent uppercase">{t("tagline")}</p>
        </div>
      </div>
      <span className="splash-hint absolute inset-x-0 text-center text-[12px] font-semibold text-ink/70" style={{ bottom: "calc(var(--safe-bottom) + 18px)" }}>
        {catalog ? "" : t("preparing")}
      </span>
    </div>
  );
}
