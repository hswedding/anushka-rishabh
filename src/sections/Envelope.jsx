import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import Icon from '../components/Icons.jsx';
import { config } from '../data.js';

/* How long we let the film buffer (after tap, or mid-play stall) before
   giving up and revealing the page — guests on slow mobile data must never
   be stuck on a black screen. */
const STALL_TIMEOUT_MS = 8000;

/* Scene 0 — the envelope film IS the opening screen. It sits full-screen on
   its first frame (also the poster, so it shows before any video loads); a
   tap plays it with sound, and when it ends (or is skipped) the page is
   revealed. Reduced motion or a video error skips straight to the page. */
export default function Envelope({ onStart, onOpen }) {
  const root = useRef(null);
  const videoRef = useRef(null);
  const watchdog = useRef(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const clearWatchdog = () => {
    if (watchdog.current) { clearTimeout(watchdog.current); watchdog.current = null; }
  };
  const armWatchdog = () => {
    clearWatchdog();
    watchdog.current = setTimeout(closeOverlay, STALL_TIMEOUT_MS);
  };
  useEffect(() => clearWatchdog, []);

  const open = () => {
    if (playing) return;
    if (reduced) {
      gsap.set(root.current, { autoAlpha: 0 });
      finish();
      return;
    }
    const video = videoRef.current;
    if (!video) return closeOverlay();
    setPlaying(true);
    onStart?.();
    // Mobile browsers on cellular skip preload, so nothing may be buffered
    // yet — show a hint and bail out if playback never starts.
    setBuffering(true);
    armWatchdog();
    // A user gesture, so playing with sound is allowed; fall back to muted.
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(closeOverlay);
    });
  };

  const closeOverlay = () => {
    clearWatchdog();
    videoRef.current?.pause();
    gsap.to(root.current, {
      autoAlpha: 0, duration: 0.8, ease: 'power2.inOut', onComplete: finish,
    });
  };

  const finish = () => onOpen?.();

  return (
    <div
      className="envelope"
      ref={root}
      role="dialog"
      aria-label="Wedding invitation — tap to open"
    >
      <video
        ref={videoRef}
        className="envelope__film"
        src={config.envelopeVideo}
        poster={config.envelopePoster || undefined}
        playsInline
        preload="auto"
        onPlaying={() => { setBuffering(false); clearWatchdog(); }}
        onWaiting={() => { if (playing) { setBuffering(true); armWatchdog(); } }}
        onEnded={closeOverlay}
        onError={() => closeOverlay()}
        aria-label="Envelope opening film"
      />

      {!playing && (
        <button
          type="button"
          className="envelope__tap"
          onClick={open}
          aria-label="Open the invitation"
        >
          <span className="envelope__cta">
            <Icon name="sparkle" size={16} /> Tap to Open
          </span>
        </button>
      )}

      {playing && buffering && (
        <span className="envelope__loading" aria-live="polite">Opening…</span>
      )}

      {playing && (
        <button type="button" className="envelope__skip" onClick={closeOverlay}>
          Skip <Icon name="sparkle" size={14} />
        </button>
      )}
    </div>
  );
}
