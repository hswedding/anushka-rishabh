import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { config } from '../data.js';
import Icon from '../components/Icons.jsx';

/* How long we let the film buffer (after the tap, or mid-play stall) before
   giving up and revealing the page — guests on slow mobile data must never be
   stuck on the envelope. */
const STALL_TIMEOUT_MS = 8000;

/* Scene 0 — the envelope film IS the opening screen. It sits full-screen on
   its first frame (also the poster, so it shows before any video loads) with
   a "Tap to Open" prompt. The tap plays the film with its own sound — a tap
   is what lets a browser play sound — and tells App (`onTap`) so the
   background score can load and be cleared to play; when the film ends the
   page is revealed and the score starts.

   If the browser refuses the film with sound it plays muted; if it refuses
   even that (iOS Low Power Mode), the film errors, or it stalls, the page is
   revealed straight away. Reduced motion skips the film: the tap reveals the
   page. */
export default function Envelope({ onTap, onOpen }) {
  const root = useRef(null);
  const videoRef = useRef(null);
  const watchdog = useRef(null);
  const closing = useRef(false);
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

  const finish = () => onOpen?.();

  const closeOverlay = () => {
    if (closing.current) return;
    closing.current = true;
    clearWatchdog();
    videoRef.current?.pause();
    gsap.to(root.current, {
      autoAlpha: 0, duration: 0.8, ease: 'power2.inOut', onComplete: finish,
    });
  };

  const open = () => {
    if (playing || closing.current) return;
    onTap?.();
    const video = videoRef.current;
    if (reduced || !video) { closeOverlay(); return; }
    setPlaying(true);
    // Mobile browsers on cellular skip preload, so nothing may be buffered
    // yet — show a hint and bail out if playback never starts.
    setBuffering(true);
    armWatchdog();
    video.muted = false;
    // Inside the tap, so sound is allowed; fall back to muted. Older Safari
    // returns undefined from play() instead of a promise.
    Promise.resolve(video.play()).catch(() => {
      video.muted = true;
      Promise.resolve(video.play()).catch(closeOverlay);
    });
  };

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
    </div>
  );
}
