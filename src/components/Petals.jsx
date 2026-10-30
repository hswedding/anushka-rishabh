import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

/* Soft marigold-and-blush petal rain on a fixed full-screen canvas. Capped
   particle count for mobile; paused entirely when reduced motion is on.
   Motion model aims for "real petal" physics on the cheap: each petal
   pendulum-swings as it falls (descending slower at the swing extremes),
   tumbles around its own axis (drawn as a width squash), leans into the
   swing, and drifts on a slow ambient breeze. Far petals are smaller,
   fainter and slower for depth. */

/* [base, tip] pairs — petals darken toward the base like the real thing */
export const COLORS = [
  ['#e09a2f', '#f7cf6f'], // marigold
  ['#d98f2b', '#efc55e'], // deep marigold
  ['#e58fa8', '#f8c7d4'], // blush
  ['#d9ab3d', '#faefd2'], // pale gold
];

export default function Petals({ active = true }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active || reduced) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf, w, h, dpr;
    let running = true;
    let prev;

    const count = window.innerWidth < 600 ? 14 : 26;

    function spawn(initial) {
      const depth = 0.45 + Math.random() * 0.55; // 0.45 far … 1 near
      return {
        x: Math.random() * (window.innerWidth + 160) - 80,
        y: initial ? Math.random() * window.innerHeight : -30 - Math.random() * 60,
        r: (6.5 + Math.random() * 6) * depth,
        depth,
        fall: 0.55 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,       // pendulum swing
        phaseSpeed: 0.014 + Math.random() * 0.014,
        swing: 0.8 + Math.random() * 1.3,
        flip: Math.random() * Math.PI * 2,        // tumble around own axis
        flipSpeed: 0.012 + Math.random() * 0.03,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.35 + depth * 0.5,
        // slight per-petal asymmetry so no two look stamped from a mould
        k1: 0.72 + Math.random() * 0.32,
        k2: 0.72 + Math.random() * 0.32,
      };
    }

    const petals = Array.from({ length: count }, () => spawn(true));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawPetal(p) {
      const { r, k1, k2 } = p;
      ctx.beginPath();
      ctx.moveTo(0, r); // base
      ctx.bezierCurveTo(r * 0.9 * k1, r * 0.5, r * 0.8 * k1, -r * 0.55, 0, -r); // to tip
      ctx.bezierCurveTo(-r * 0.8 * k2, -r * 0.55, -r * 0.9 * k2, r * 0.5, 0, r);
      const g = ctx.createLinearGradient(0, r, 0, -r);
      g.addColorStop(0, p.color[0]);
      g.addColorStop(1, p.color[1]);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function draw(t) {
      const dt = prev === undefined ? 1 : Math.min((t - prev) / 16.7, 3);
      prev = t;
      // slow ambient breeze the whole shower shares, with a long swell in it
      const wind = Math.sin(t * 0.00022) * 0.45 + Math.sin(t * 0.00007) * 0.3;

      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.phase += p.phaseSpeed * dt;
        p.flip += p.flipSpeed * dt;
        p.rot += p.rotSpeed * dt;

        const swingV = Math.cos(p.phase); // pendulum velocity
        p.x += (swingV * p.swing + wind * (0.5 + p.depth * 0.7)) * dt;
        // petals sink fastest mid-swing, hang at the extremes
        p.y += p.fall * p.depth * (0.7 + 0.5 * Math.abs(swingV)) * dt;

        if (p.y > h + 30 || p.x < -100 || p.x > w + 100) Object.assign(p, spawn(false));

        ctx.save();
        ctx.translate(p.x, p.y);
        // lean into the swing + tumble squash (edge-on petals almost vanish)
        ctx.rotate(p.rot + swingV * 0.45);
        ctx.scale(0.22 + 0.78 * Math.abs(Math.sin(p.flip)), 1);
        ctx.globalAlpha = p.alpha;
        drawPetal(p);
        ctx.restore();
      }
      if (running) raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(resize, 150); };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, [active, reduced]);

  if (reduced) return null;
  return (
    <canvas
      id="petals-canvas"
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 'var(--z-petals)',
      }}
    />
  );
}
