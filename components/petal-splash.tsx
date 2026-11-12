"use client";

import { useEffect, useRef, useState } from "react";
import { useShop } from "./shop-provider";

/**
 * Opening animation: a rose blooms in the centre, then petals, small roses and
 * leaves burst out, flutter down and pile up on the floor before the app opens.
 * Canvas 2D with pre-rendered sprites, so it stays smooth inside Telegram.
 */

const PETAL_COLORS: [string, string][] = [
  ["#fbe3e6", "#eeb1bd"],
  ["#f6c4ce", "#de7f95"],
  ["#f1a7b7", "#c9566f"],
  ["#e98399", "#b23f59"],
  ["#d9677f", "#9c2f49"],
  ["#fff3ee", "#f2c9c1"],
  ["#c2455e", "#7f1f35"],
];
const LEAF_COLORS: [string, string][] = [
  ["#a9c095", "#5f7f4f"],
  ["#8fae7c", "#4d6b3f"],
];

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };

function petalPath(ctx: CanvasRenderingContext2D, w: number, h: number, curl: number) {
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.bezierCurveTo(-w * 0.62, h * 0.18, -w * 0.58 - curl, -h * 0.42, -w * 0.08, -h / 2);
  ctx.quadraticCurveTo(0, -h * 0.4, w * 0.08, -h / 2);
  ctx.bezierCurveTo(w * 0.58 + curl, -h * 0.42, w * 0.62, h * 0.18, 0, h / 2);
  ctx.closePath();
}

function makePetal(dpr: number, [light, dark]: [string, string], w: number, h: number, curl: number): Sprite {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * dpr * 1.4);
  c.height = Math.ceil(h * dpr * 1.2);
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.translate((w * 1.4) / 2, (h * 1.2) / 2);
  petalPath(ctx, w, h, curl);
  const g = ctx.createRadialGradient(0, -h * 0.15, h * 0.05, 0, h * 0.25, h * 0.75);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fill();
  // soft fold shading near the base
  const base = ctx.createLinearGradient(0, h / 2, 0, h * 0.05);
  base.addColorStop(0, "rgba(90,20,35,0.28)");
  base.addColorStop(1, "rgba(90,20,35,0)");
  ctx.fillStyle = base;
  ctx.fill();
  // edge highlight
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.stroke();
  // centre vein
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.quadraticCurveTo(w * 0.05, 0, 0, -h * 0.3);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  return { canvas: c, w: w * 1.4, h: h * 1.2 };
}

function makeLeaf(dpr: number, [light, dark]: [string, string], w: number, h: number): Sprite {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * dpr * 1.2);
  c.height = Math.ceil(h * dpr * 1.2);
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.translate((w * 1.2) / 2, (h * 1.2) / 2);
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.quadraticCurveTo(w * 0.62, -h * 0.05, 0, h / 2);
  ctx.quadraticCurveTo(-w * 0.62, -h * 0.05, 0, -h / 2);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.45);
  ctx.lineTo(0, h * 0.45);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  return { canvas: c, w: w * 1.2, h: h * 1.2 };
}

/** A small top-down rose: rings of petals spiralling into a dark centre. */
function makeRose(dpr: number, palette: [string, string], size: number): Sprite {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(size * dpr * 1.15);
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.translate((size * 1.15) / 2, (size * 1.15) / 2);
  const rings = 5;
  for (let r = 0; r < rings; r++) {
    const t = r / (rings - 1);
    const count = 7 - Math.floor(r * 0.8);
    const dist = size * (0.3 - t * 0.27);
    const pw = size * (0.42 - t * 0.2);
    const ph = size * (0.36 - t * 0.17);
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate((i / count) * Math.PI * 2 + r * 0.55);
      ctx.translate(0, -dist);
      petalPath(ctx, pw, ph, 0);
      const g = ctx.createRadialGradient(0, -ph * 0.3, 1, 0, ph * 0.4, ph);
      g.addColorStop(0, palette[0]);
      g.addColorStop(1, palette[1]);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(80,15,30,0.18)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = palette[1];
  ctx.fill();
  return { canvas: c, w: size * 1.15, h: size * 1.15 };
}

type P = {
  s: Sprite; x: number; y: number; vx: number; vy: number; rot: number; vr: number;
  flip: number; vflip: number; scale: number; sway: number; swayF: number; t: number;
  rest: boolean; heavy: boolean; alpha: number;
};

export function PetalSplash() {
  const { catalog, haptic } = useShop();
  const [phase, setPhase] = useState<"bloom" | "burst" | "leaving" | "gone">("bloom");
  const [reduced, setReduced] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(performance.now());
  const leaveRef = useRef<() => void>(() => {});

  // Only once per Telegram session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("roses_splash") === "1") setPhase("gone");
      else sessionStorage.setItem("roses_splash", "1");
    } catch { /* ignore */ }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Lock scrolling while the splash is visible.
  useEffect(() => {
    if (phase === "gone") {
      document.documentElement.classList.remove("splash-lock");
      return;
    }
    document.documentElement.classList.add("splash-lock");
  }, [phase]);

  useEffect(() => {
    if (phase === "gone") return;
    const leave = () => {
      setPhase((p) => (p === "gone" || p === "leaving" ? p : "leaving"));
      setTimeout(() => setPhase("gone"), 750);
    };
    leaveRef.current = leave;
    const minTime = reduced ? 700 : 3900;
    const elapsed = performance.now() - started.current;
    const ready = Boolean(catalog);
    const t = setTimeout(() => ready && leave(), Math.max(0, minTime - elapsed));
    const hard = setTimeout(leave, 7000);
    return () => { clearTimeout(t); clearTimeout(hard); };
  }, [catalog, reduced, phase]);

  useEffect(() => {
    if (phase !== "bloom" || reduced) return;
    const t = setTimeout(() => { setPhase("burst"); haptic("tap"); }, 650);
    return () => clearTimeout(t);
  }, [phase, reduced, haptic]);

  // Physics loop.
  useEffect(() => {
    if (reduced || phase === "gone" || phase === "bloom") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const petals: Sprite[] = [];
    for (const col of PETAL_COLORS) {
      petals.push(makePetal(dpr, col, 22, 26, 2));
      petals.push(makePetal(dpr, col, 28, 22, -1));
      petals.push(makePetal(dpr, col, 18, 24, 3));
    }
    const leaves = LEAF_COLORS.flatMap((c) => [makeLeaf(dpr, c, 18, 34), makeLeaf(dpr, c, 14, 26)]);
    const roses = [
      makeRose(dpr, ["#f7c9d2", "#c9566f"], 46),
      makeRose(dpr, ["#e98399", "#8e2440"], 40),
      makeRose(dpr, ["#fff1ec", "#e3a7a4"], 42),
      makeRose(dpr, ["#d9677f", "#6f1529"], 36),
    ];

    const COLS = Math.ceil(W / 6);
    const heap = new Float32Array(COLS);
    const parts: P[] = [];
    const cx = W / 2;
    const cy = H * 0.42;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

    const spawn = (x: number, y: number, vx: number, vy: number, kind: "petal" | "leaf" | "rose"): P => ({
      s: kind === "rose" ? pick(roses) : kind === "leaf" ? pick(leaves) : pick(petals),
      x, y, vx, vy,
      rot: rnd(0, Math.PI * 2), vr: rnd(-6, 6),
      flip: rnd(0, Math.PI * 2), vflip: kind === "rose" ? 0 : rnd(3, 9),
      scale: kind === "rose" ? rnd(0.7, 1.15) : rnd(0.7, 1.3),
      sway: kind === "rose" ? rnd(4, 10) : rnd(14, 34), swayF: rnd(1.5, 3.2), t: rnd(0, 10),
      rest: false, heavy: kind === "rose", alpha: 1,
    });

    // Burst from the blooming rose.
    const burst = (n: number, power: number) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05);
        const sp = rnd(260, 900) * power;
        const kind = Math.random() < 0.1 ? "rose" : Math.random() < 0.14 ? "leaf" : "petal";
        parts.push(spawn(cx + rnd(-10, 10), cy + rnd(-10, 10), Math.cos(a) * sp, Math.sin(a) * sp, kind));
      }
    };
    burst(130, 1);
    // A second, gentler shower from the top edge.
    const timers = [
      setTimeout(() => burst(50, 0.7), 260),
      setTimeout(() => {
        for (let i = 0; i < 170; i++) {
          const kind = Math.random() < 0.08 ? "rose" : Math.random() < 0.12 ? "leaf" : "petal";
          parts.push(spawn(rnd(-20, W + 20), rnd(-160, -20), rnd(-30, 30), rnd(40, 120), kind));
        }
      }, 420),
      setTimeout(() => {
        for (let i = 0; i < 110; i++) {
          const kind = Math.random() < 0.12 ? "rose" : Math.random() < 0.1 ? "leaf" : "petal";
          parts.push(spawn(rnd(-20, W + 20), rnd(-240, -20), rnd(-20, 20), rnd(120, 220), kind));
        }
      }, 1300),
    ];

    let last = performance.now();
    let raf = 0;
    const G = 900;
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        if (!p.rest) {
          p.t += dt;
          p.vy += G * dt * (p.heavy ? 1 : 0.55);
          const drag = p.heavy ? 0.992 : 0.972;
          p.vx *= drag;
          p.vy *= drag;
          const maxFall = p.heavy ? 560 : 230 + p.scale * 60;
          if (p.vy > maxFall) p.vy = maxFall;
          p.x += (p.vx + Math.sin(p.t * p.swayF) * p.sway) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt * (p.vy > 0 ? 0.6 : 1);
          p.flip += p.vflip * dt;
          if (p.x < -40) p.x = W + 30;
          if (p.x > W + 40) p.x = -30;
          // Settle on the growing pile.
          const col = Math.max(0, Math.min(COLS - 1, (p.x / 6) | 0));
          const size = p.s.h * p.scale;
          const floor = H - heap[col] - size * 0.22;
          if (p.vy > 0 && p.y >= floor) {
            p.y = floor;
            p.rest = true;
            const add = size * (p.heavy ? 0.55 : 0.3);
            const spread = Math.ceil((p.s.w * p.scale) / 12);
            for (let k = -spread; k <= spread; k++) {
              const c2 = col + k;
              if (c2 >= 0 && c2 < COLS) heap[c2] += add * (1 - Math.abs(k) / (spread + 1));
            }
            p.flip = Math.random() < 0.5 ? 0.25 : Math.PI - 0.25;
          }
        }
        const fx = Math.max(0.18, Math.abs(Math.cos(p.flip)));
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.scale * fx, p.scale);
        ctx.drawImage(p.s.canvas, -p.s.w / 2, -p.s.h / 2, p.s.w, p.s.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // The loop must keep running through the "leaving" phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, phase === "gone", phase === "bloom"]);

  if (phase === "gone") return null;
  const leaving = phase === "leaving";

  return (
    <div
      className={`splash fixed inset-0 z-[100] overflow-hidden ${leaving ? "splash-out" : ""}`}
      onClick={() => leaveRef.current()}
      role="status"
      aria-label="Roses yuklanmoqda"
    >
      {!reduced ? <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${leaving ? "splash-canvas-out" : ""}`} aria-hidden /> : null}
      <div className={`pointer-events-none absolute inset-0 grid place-items-center ${leaving ? "splash-logo-out" : ""}`}>
        <div className="flex flex-col items-center" style={{ transform: "translateY(-8vh)" }}>
          <BloomingRose />
          <p className="splash-word mt-5 font-display text-[54px] leading-none font-bold tracking-tight text-ink [text-shadow:0_0_24px_#fbf5f1,0_0_8px_#fbf5f1]">Roses</p>
          <p className="splash-tag mt-2 text-[13px] font-semibold tracking-[0.3em] text-accent uppercase">gul do‘koni</p>
        </div>
      </div>
      <span className="splash-hint absolute inset-x-0 text-center text-[12px] font-semibold text-muted" style={{ bottom: "calc(var(--safe-bottom) + 18px)" }}>
        {catalog ? "" : "Gullar tayyorlanmoqda…"}
      </span>
    </div>
  );
}

/** SVG rose whose petals unfold one ring after another. */
function BloomingRose() {
  const rings = [
    { n: 6, r: 30, w: 30, h: 34, c1: "#f7cfd7", c2: "#d26a83", d: 0 },
    { n: 5, r: 20, w: 25, h: 28, c1: "#ef9fb1", c2: "#b9445f", d: 120 },
    { n: 5, r: 11, w: 19, h: 21, c1: "#e2768f", c2: "#9a2b46", d: 240 },
    { n: 4, r: 4, w: 13, h: 14, c1: "#c9506b", c2: "#7c1a33", d: 360 },
  ];
  return (
    <svg width="132" height="132" viewBox="-66 -66 132 132" aria-hidden className="splash-rose overflow-visible">
      <defs>
        {rings.map((r, i) => (
          <radialGradient key={i} id={`rg${i}`} cx="50%" cy="20%" r="90%">
            <stop offset="0%" stopColor={r.c1} />
            <stop offset="100%" stopColor={r.c2} />
          </radialGradient>
        ))}
      </defs>
      <g className="splash-leaves">
        <path d="M-6 30 C -40 30, -52 52, -58 60 C -34 62, -14 50, -6 30 Z" fill="#8fae7c" />
        <path d="M6 30 C 40 30, 52 52, 58 60 C 34 62, 14 50, 6 30 Z" fill="#7d9b6c" />
      </g>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }).map((_, i) => {
          const a = (360 / ring.n) * i + ri * 23;
          return (
            <g key={`${ri}-${i}`} transform={`rotate(${a})`}>
              <g transform={`translate(0 ${-ring.r})`}>
                <path
                  className="bloom-petal"
                  style={{ animationDelay: `${ring.d + i * 35}ms` }}
                  d={`M0 ${ring.h / 2} C ${-ring.w * 0.62} ${ring.h * 0.18}, ${-ring.w * 0.58} ${-ring.h * 0.42}, ${-ring.w * 0.08} ${-ring.h / 2} Q 0 ${-ring.h * 0.4} ${ring.w * 0.08} ${-ring.h / 2} C ${ring.w * 0.58} ${-ring.h * 0.42}, ${ring.w * 0.62} ${ring.h * 0.18}, 0 ${ring.h / 2} Z`}
                  fill={`url(#rg${ri})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
              </g>
            </g>
          );
        }),
      )}
    </svg>
  );
}
