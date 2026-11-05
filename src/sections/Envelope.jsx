import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { config } from '../data.js';

/* How long we let the film buffer (at load, or mid-play stall) before giving
   up and revealing the page — guests on slow mobile data must never be stuck
   on the envelope. */
const STALL_TIMEOUT_MS = 8000;

/* Scene 0 — the envelope film IS the opening screen. It sits full-screen on
   its first frame (also the poster, so it shows before any video loads) and
   plays by itself as soon as the page loads — no "tap to open", no skip —
   then the page is revealed when it ends.

   Browsers only autoplay video muted, so the film starts silent; a tap while
   it plays turns its sound on (and lets the background score start at the
   reveal). If the browser refuses even muted autoplay (iOS Low Power Mode),
   the film errors, or it stalls, the page is revealed straight away. Reduced
   motion skips the film entirely. */
export default function Envelope({ onStart, onTap, onOpen }) {
  const root = useRef(null);
  const videoRef = useRef(null);
  const watchdog = useRef(null);
  const closing = useRef(false);
  const reduced = useReducedMotion();
  const [buffering, setBuffering] = useState(true);

  const clearWatchdog = () => {
    if (watchdog.current) { clearTimeout(watchdog.current); watchdog.current = null; }
  };
  const armWatchdog = () => {
    clearWatchdog();
    watchdog.current = setTimeout(closeOverlay, STALL_TIMEOUT_MS);
  };

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

  // Play on load.
  useEffect(() => {
    if (reduced) { finish(); return; }
    const video = videoRef.current;
    if (!video) { finish(); return; }
    onStart?.();
    // Muted is what lets a browser autoplay without a tap. Set the property
    // (React doesn't reflect `muted` as an attribute, which iOS checks).
    video.muted = true;
    video.defaultMuted = true;
    // Mobile browsers on cellular skip preload, so nothing may be buffered
    // yet — bail out if playback never starts.
    armWatchdog();
    Promise.resolve(video.play()).catch(closeOverlay);
    return clearWatchdog;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tap during the film is a user gesture: its sound may come on, and the
  // background score gets unlocked to start at the reveal.
  const onTapFilm = () => {
    const video = videoRef.current;
    if (video && video.muted && !closing.current) video.muted = false;
    onTap?.();
  };

  return (
    <div
      className="envelope"
      ref={root}
      role="dialog"
      aria-label="Wedding invitation — opening"
      onPointerUp={onTapFilm}
    >
      <video
        ref={videoRef}
        className="envelope__film"
        src={config.envelopeVideo}
        poster={config.envelopePoster || undefined}
        playsInline
        muted
        preload="auto"
        onPlaying={() => { setBuffering(false); clearWatchdog(); }}
        onWaiting={() => { setBuffering(true); armWatchdog(); }}
        onEnded={closeOverlay}
        onError={() => closeOverlay()}
        aria-label="Envelope opening film"
      />

      {buffering && (
        <span className="envelope__loading" aria-live="polite">Opening…</span>
      )}
    </div>
  );
}
