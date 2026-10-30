import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { COLORS as PETALS } from './Petals.jsx';

const GOLD = ['#f6dd97', '#efc55e', '#d9a02b', '#a97a18']; // the film frames' leaf
const REVEAL_AT = 0.45; // share of foil cleared before the rest lifts off
const BRUSH = 16; // radius — about a fingertip

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[(Math.random() * list.length) | 0];

/* Each piece of the sparkle draws itself. Foil turns pale then dark as it
   tumbles, which is what makes it read as metal; stars swell and shrink once;
   dust glitters; petals match the rain on the page, darker toward the base. */
const drawFoil = (ctx, f) => {
  const turn = Math.sin(f.age * f.flutter + f.rot);
  ctx.scale(turn, 1);
  ctx.fillStyle = turn > 0 ? f.color : '#a97a18';
  ctx.beginPath();
  f.shape.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.fill();
};
const starPath = (ctx, r) => {
  const k = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(k, -k, r, 0);
  ctx.quadraticCurveTo(k, k, 0, r);
  ctx.quadraticCurveTo(-k, k, -r, 0);
  ctx.quadraticCurveTo(-k, -k, 0, -r);
  ctx.fill();
};
const drawStar = (ctx, f) => {
  const r = f.size * Math.sin((Math.PI * f.age) / f.life) ** 0.7;
  ctx.fillStyle = 'rgba(239, 197, 94, 0.3)'; // the glow around it
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98f1c';
  starPath(ctx, r);
  ctx.fillStyle = '#fffdf2';
  starPath(ctx, r * 0.5);
};
const drawDust = (ctx, f) => {
  ctx.globalAlpha *= 0.55 + 0.45 * Math.sin(f.age * f.flutter);
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(0, 0, f.size, 0, Math.PI * 2);
  ctx.fill();
};
const drawPetal = (ctx, f) => {
  const { w, h } = f;
  ctx.scale(0.55 + 0.45 * Math.sin(f.age * f.flutter + f.rot), 1);
  const shade = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  shade.addColorStop(0, f.color[0]);
  shade.addColorStop(1, f.color[1]);
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.bezierCurveTo(w * 0.6, -h / 4, w * 0.55, h * 0.35, 0, h / 2);
  ctx.bezierCurveTo(-w * 0.55, h * 0.35, -w * 0.6, -h / 4, 0, -h / 2);
  ctx.fill();
};

/* Sparkle on a temporary full-viewport canvas, so it can spill past the card's
   overflow:hidden wrap. It exists only while something is in the air. */
let layer = null;
function shed(pieces) {
  if (layer) { layer.pieces.push(...pieces); return; }
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 30,
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  layer = { pieces: [...pieces] };

  let prev;
  const tick = (t) => {
    const dt = Math.min((t - (prev ?? t)) / 1000, 0.032);
    prev = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layer.pieces = layer.pieces.filter((p) => (p.age += dt) < p.life);
    for (const p of layer.pieces) {
      if (p.age < 0) continue; // waiting for the light to reach it
      const drag = p.drag ** (dt * 60);
      p.vy += p.gravity * dt;
      p.vx = (p.vx + Math.cos(p.age * 3) * (p.sway || 0) * dt) * drag;
      p.vy *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.life - p.age) / (p.life * 0.3));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      p.draw(ctx, p);
      ctx.restore();
    }
    if (layer.pieces.length) requestAnimationFrame(tick);
    else { canvas.remove(); layer = null; }
  };
  requestAnimationFrame(tick);
}

/* An uneven scrap of foil, w × h. */
const scrap = (w, h) => [[-w, -h], [w, -h], [w, h], [-w, h]]
  .map(([x, y]) => [(x / 2) * rand(0.5, 1), (y / 2) * rand(0.5, 1)]);

/* A speck of foil coming off under the finger. */
const shaving = (x, y) => ({
  x, y, vx: rand(-90, 90), vy: rand(-140, -20), gravity: 900, drag: 0.985,
  shape: scrap(rand(2, 5), rand(2, 6)), rot: rand(0, 6), vr: rand(-10, 10),
  flutter: rand(3, 7), color: pick(GOLD), life: rand(0.5, 0.9), age: 0, draw: drawFoil,
});

/* A random spot on the card's edge, with the way out from it. */
function edge(r) {
  let d = rand(0, 2 * (r.width + r.height));
  if (d < r.width) return { x: r.left + d, y: r.top, nx: 0, ny: -1 };
  d -= r.width;
  if (d < r.height) return { x: r.right, y: r.top + d, nx: 1, ny: 0 };
  d -= r.height;
  if (d < r.width) return { x: r.right - d, y: r.bottom, nx: 0, ny: 1 };
  return { x: r.left, y: r.bottom - (d - r.width), nx: -1, ny: 0 };
}

/* The moment of reveal, staying clear of the date. Light runs both ways round
   the card's edge from where the finger stopped, setting off stars, gold dust
   and the last scraps of foil as it passes, while a few petals rise and drift
   down either side. A few late stars let it settle rather than stop. */
function sparkle(r, from) {
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const start = Math.atan2(from.y - cy, from.x - cx);
  const reach = (x, y) => { // seconds until the light gets here
    const gap = Math.abs(Math.atan2(y - cy, x - cx) - start);
    return (Math.min(gap, Math.PI * 2 - gap) / Math.PI) * 0.6;
  };
  const stars = Array.from({ length: 32 }, (_, i) => {
    const e = edge(r), out = rand(-2, 16);
    return {
      x: e.x + e.nx * out, y: e.y + e.ny * out,
      vx: e.nx * rand(6, 26), vy: e.ny * rand(6, 26) - 8, gravity: 0, drag: 0.98,
      size: i % 5 ? rand(5, 10) : rand(12, 17), rot: rand(-0.3, 0.3), vr: rand(-0.6, 0.6),
      life: rand(0.7, 1.15), age: -reach(e.x, e.y) - (i < 8 ? rand(0.7, 1.5) : 0), draw: drawStar,
    };
  });
  const dust = Array.from({ length: 70 }, () => {
    const e = edge(r), speed = rand(20, 120);
    return {
      x: e.x, y: e.y, vx: e.nx * speed + rand(-16, 16), vy: e.ny * speed - rand(10, 60),
      gravity: 36, drag: 0.97, size: rand(0.8, 2.2), rot: 0, vr: 0, flutter: rand(8, 18),
      color: pick(GOLD.slice(1)), life: rand(1.2, 2.6), age: -reach(e.x, e.y), draw: drawDust,
    };
  });
  const foil = Array.from({ length: 22 }, () => {
    const e = edge(r), speed = rand(60, 240);
    return {
      x: e.x, y: e.y, vx: e.nx * speed + Math.sign(e.x - cx) * rand(50, 150), vy: e.ny * speed - rand(60, 180),
      gravity: 420, drag: 0.975, shape: scrap(rand(4, 9), rand(5, 11)),
      rot: rand(0, 6), vr: rand(-6, 6), flutter: rand(4, 9), color: pick(GOLD.slice(0, 3)),
      life: rand(1.2, 2), age: -reach(e.x, e.y), draw: drawFoil,
    };
  });
  const petals = Array.from({ length: 14 }, (_, i) => {
    const side = i % 2 ? 1 : -1; // out to either side, to fall clear of the date
    return {
      x: cx + side * rand(0.3, 0.5) * r.width, y: r.top,
      vx: side * rand(110, 220), vy: rand(-340, -170),
      gravity: 300, drag: 0.965, sway: 70, w: rand(9, 14), h: rand(13, 20),
      rot: rand(0, 6), vr: rand(-2, 2), flutter: rand(2, 5), color: pick(PETALS),
      life: rand(2.2, 3.2), age: -rand(0.1, 0.45), draw: drawPetal,
    };
  });
  return [...stars, ...dust, ...foil, ...petals];
}

/* The foil: gold leaf in the same gradient as the film frames, pressed with a
   jaali lattice that fades out around the prompt. The prompt is engraved in
   the leaf, so it is scratched away with the rest. */
function paintFoil(ctx, w, h, prompt, font) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);

  const S = 22;
  const lattice = (dy, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let row = -1; row * S < h + S; row++) {
      for (let col = -1; col * S < w + S; col += 2) {
        const x = (col + (row & 1)) * S, y = row * S + dy, k = S * 0.12;
        ctx.moveTo(x, y - S);
        ctx.quadraticCurveTo(x + k, y - k, x + S, y);
        ctx.quadraticCurveTo(x + k, y + k, x, y + S);
        ctx.quadraticCurveTo(x - k, y + k, x - S, y);
        ctx.quadraticCurveTo(x - k, y - k, x, y - S);
      }
    }
    ctx.stroke();
  };
  lattice(1, 'rgba(122, 84, 16, 0.32)'); // shadow, then highlight: pressed in
  lattice(0, 'rgba(255, 248, 224, 0.42)');

  // Lift the lattice away from the centre, then slide the gold in underneath.
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, 0.5);
  const calm = ctx.createRadialGradient(0, 0, w * 0.2, 0, 0, w * 0.46);
  calm.addColorStop(0, '#000');
  calm.addColorStop(1, 'transparent');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = calm;
  ctx.fillRect(-w, -h * 2, w * 2, h * 4);
  ctx.restore();

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#f6dd97');
  base.addColorStop(0.32, '#d9a02b');
  base.addColorStop(0.58, '#c89a2c');
  base.addColorStop(0.82, '#eec867');
  base.addColorStop(1, '#f6dd97');
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  if (!prompt) return;
  const words = prompt.split(' ');
  const mid = Math.ceil(words.length / 2);
  const lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * 28;
    ctx.fillStyle = 'rgba(255, 248, 224, 0.6)'; // the light catching the cut
    ctx.fillText(line, w / 2, y + 1, w - 36);
    ctx.fillStyle = '#3a2c04';
    ctx.fillText(line, w / 2, y, w - 36);
  });
}

/* Canvas scratch-to-reveal. The revealed content sits underneath; gold foil is
   rubbed away as the guest scratches, and past REVEAL_AT the rest lifts off.
   Vertical swipes still scroll the page (`touch-action: pan-y`), so a card
   under the thumb never traps it. `covered={false}` — or reduced motion — shows
   the content plainly. */
export default function ScratchCard({ prompt, covered = true, children, height = 150 }) {
  const reduced = useReducedMotion();
  const canRef = useRef(null);
  const wrapRef = useRef(null);
  const fingerRef = useRef(null);
  const [scratched, setScratched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const useCanvas = covered && !reduced;

  useEffect(() => {
    if (!useCanvas || revealed) return;
    const canvas = canRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: w, height: h } = canvas.getBoundingClientRect();
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let touched = false;
    const family = getComputedStyle(canvas).getPropertyValue('--font-serif').trim() || 'serif';
    const font = `italic 500 21px ${family}`;
    paintFoil(ctx, w, h, prompt, font);
    // canvas text doesn't wait for webfonts — repaint once it has arrived
    document.fonts?.load(font).then(() => { if (!touched) paintFoil(ctx, w, h, prompt, font); });

    const scrape = (from, to) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = ctx.fillStyle = '#000';
      ctx.lineWidth = BRUSH * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x + 0.1, to.y); // a zero-length line wouldn't draw a tap
      ctx.stroke();
      // nicks along the edge, so the foil looks torn rather than cut
      for (let i = 0; i < 5; i++) {
        const a = rand(0, Math.PI * 2), d = BRUSH + rand(0, 5);
        ctx.beginPath();
        ctx.arc(to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, rand(1, 2.5), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const check = () => {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0;
      for (let i = 3; i < data.length; i += 40) if (data[i] === 0) clear++;
      if (clear / (data.length / 40) > REVEAL_AT) setRevealed(true);
    };

    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (w / r.width), y: (e.clientY - r.top) * (h / r.height) };
    };

    let last = null;
    let moved = false;
    let lastCheck = 0;
    const rub = (to, e) => {
      if (!touched) { touched = true; setScratched(true); }
      fingerRef.current = { x: e.clientX, y: e.clientY };
      const dist = Math.hypot(to.x - last.x, to.y - last.y);
      scrape(last, to);
      last = to;
      if (to.x >= 0 && to.x <= w && to.y >= 0 && to.y <= h) {
        shed(Array.from({ length: Math.min(3, Math.ceil(dist / 14) || 2) },
          () => shaving(e.clientX, e.clientY)));
      }
      const now = performance.now();
      if (now - lastCheck > 150) { lastCheck = now; check(); }
    };

    // Nothing is scraped on press: a thumb landing here to scroll leaves no mark.
    const down = (e) => {
      if (e.button) return;
      canvas.setPointerCapture(e.pointerId);
      last = point(e);
      moved = false;
    };
    const move = (e) => {
      if (!last) return;
      const p = point(e);
      if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
      moved = true;
      rub(p, e);
    };
    // pointercancel is the browser taking over to scroll
    const up = (e) => {
      if (last && !moved && e.type === 'pointerup') rub(last, e);
      if (last) check();
      last = null;
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  }, [useCanvas, revealed, prompt]);

  // The moment itself. No finger (keyboard, the link) starts it at the bottom.
  useEffect(() => {
    if (!revealed) return;
    const rect = wrapRef.current.getBoundingClientRect();
    shed(sparkle(rect, fingerRef.current ?? { x: rect.left + rect.width / 2, y: rect.bottom }));
    navigator.vibrate?.([12, 40, 18]);
  }, [revealed]);

  const state = `${scratched ? ' is-scratched' : ''}${revealed ? ' is-revealed' : ''}`;
  return (
    <div className={`scratch${state}`}>
      <div className="scratch__wrap" ref={wrapRef} style={{ minHeight: height }}>
        <div className="scratch__reveal">{children}</div>
        {useCanvas && (
          <>
            <canvas
              ref={canRef}
              className="scratch__canvas"
              role="button"
              tabIndex={0}
              aria-label={`${prompt || 'Scratch to reveal'} — or press Enter to reveal`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(true); }
              }}
            />
            <span className="scratch__glint" aria-hidden="true" />
          </>
        )}
      </div>
      {useCanvas && (
        <button type="button" className="scratch__skip" onClick={() => setRevealed(true)}>
          Show the date
        </button>
      )}
    </div>
  );
}
