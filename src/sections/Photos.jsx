import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { photos } from '../data.js';
import Icon from '../components/Icons.jsx';

// enough repeats that the reel never shows an empty edge, even with few photos
const COPIES = Math.max(3, Math.ceil(16 / Math.max(photos.length, 1)));
const SPEED = 30;   // drift, px per second
const EASE = 0.04;  // how fast a fling settles back into the drift (per frame)

/* Scene 2½ — the couple's photos as an endless, slowly drifting reel of prints.
   Drag/swipe to browse (with momentum); hover, focus or the pause button stop
   the drift; arrow keys nudge it. Reduced motion → no drift, drag still works. */
export default function Photos() {
  const root = useRef(null);
  const track = useRef(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  // live flags read by the ticker without re-subscribing it
  const flags = useRef({ paused, reduced, held: false, kick: 0 });
  flags.current.paused = paused;
  flags.current.reduced = reduced;

  useEffect(() => {
    const el = track.current;
    if (!el) return; // no photos: the section isn't rendered
    const f = flags.current;
    let x = 0, v = 0, period = 0, onScreen = false;
    let dragging = false, lastX = 0, lastT = 0;

    // one set's width = distance from the first card to its first repeat
    const measure = () => {
      period = el.children[photos.length].offsetLeft - el.children[0].offsetLeft;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const st = ScrollTrigger.create({
      trigger: root.current, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { onScreen = s.isActive; },
    });
    onScreen = st.isActive;

    const tick = (_time, deltaMs) => {
      if (!onScreen || !period) return;
      if (f.kick) { v = f.kick; f.kick = 0; }
      if (!dragging) {
        const target = f.paused || f.reduced || f.held ? 0 : SPEED;
        v += (target - v) * EASE;
        x -= v * Math.min(deltaMs, 50) / 1000;
      }
      x = (((x % period) + period) % period) - period; // wrap into [-period, 0)
      el.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);

    const down = (e) => {
      dragging = true; lastX = e.clientX; lastT = e.timeStamp; v = 0;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dt = Math.max(e.timeStamp - lastT, 1);
      x += dx;
      v = Math.max(-2000, Math.min(2000, (-dx / dt) * 1000)); // fling velocity
      lastX = e.clientX; lastT = e.timeStamp;
    };
    const up = () => { dragging = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up); // vertical page scroll took over

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      st.kill();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  if (!photos.length) return null;

  const hold = (held) => () => { flags.current.held = held; };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') flags.current.kick = 900;
    else if (e.key === 'ArrowLeft') flags.current.kick = -900;
    else return;
    e.preventDefault();
  };

  return (
    <section className="photos section" id="photos-section" ref={root}>
      <div className="section__inner">
        <p className="eyebrow">Together</p>
        <h2 className="display">Two of Us</h2>
      </div>

      <div
        className="photos__viewport" tabIndex={0} role="region"
        aria-label="Our photos. Drag or use the arrow keys to browse."
        onKeyDown={onKey}
        onPointerEnter={(e) => e.pointerType === 'mouse' && hold(true)()}
        onPointerLeave={hold(false)} onBlur={hold(false)}
        // keyboard focus only — a tap/drag also focuses, and mustn't stall the drift
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && hold(true)()}
      >
        <div className="photos__reel">
          <ul className="photos__track" ref={track}>
            {Array.from({ length: COPIES }, (_, copy) =>
              photos.map((p, i) => (
                <li
                  key={`${copy}-${p.src}`}
                  className={`photos__card${i % 2 ? ' photos__card--tilt' : ''}`}
                  aria-hidden={copy > 0 || undefined}
                >
                  <img src={p.src} alt={copy ? '' : p.alt} draggable="false"
                    loading="lazy" decoding="async"
                    style={p.focus ? { objectPosition: p.focus } : undefined} />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {!reduced && (
        <button type="button" className="photos__toggle" onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play photos' : 'Pause photos'}>
          <Icon name={paused ? 'play' : 'pause'} size={18} />
        </button>
      )}
    </section>
  );
}
