import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';

/* App-wide background score — one looped <audio> element that follows the
   global sound toggle in App.jsx. Fades in/out so it never snaps on.

   Nothing is fetched until the guest's first tap. With the envelope, that's
   the "Tap to Open": App calls `unlock` inside it, which starts loading the
   score and plays it muted for a moment so the browser counts it as started
   by the guest (iOS Safari needs this for each element); the score then
   starts when `playing` turns on — at the reveal, once the film has ended.

   Without a tap first (links without the envelope), the score tries to start
   at once — some browsers allow that — and if refused, `blocked` turns true
   and it starts on the guest's first tap or key press anywhere (a scroll
   doesn't count, so we keep listening). The sound toggle shows "off" while
   blocked, and `start` (called from its tap) starts the score rather than
   muting it.

   Phones keep a page's audio going after the guest leaves the browser, so the
   score stops while the page is hidden and fades back in on return. */
export default function useBackgroundMusic(src, playing, volume = 0.35) {
  const audioRef = useRef(null);
  const [visible, setVisible] = useState(!document.hidden);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onChange = () => {
      // Pause at once — a hidden tab doesn't run the fade, so it would never finish.
      if (document.hidden && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.volume = 0;
      }
      setVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  playing = playing && visible;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none'; // set before src, so loading waits
    audio.src = src;
    audio.loop = true;
    audio.volume = 0; // faded up on play
    audioRef.current = audio;
    return () => {
      gsap.killTweensOf(audio);
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  // Play and fade up. Inside a tap this is always allowed.
  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return Promise.reject();
    audio.muted = false;
    // Older Safari returns undefined from play() instead of a promise.
    return Promise.resolve(audio.play()).then(() => {
      setBlocked(false);
      gsap.to(audio, { volume, duration: 1.4 });
    });
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    gsap.killTweensOf(audio);

    if (!playing) {
      gsap.to(audio, { volume: 0, duration: 0.4, onComplete: () => audio.pause() });
      return;
    }

    let cancelled = false;
    // pointerup/touchend, not pointerdown: a touch only counts as a gesture
    // on release. The toggle handles its own tap (see `start`).
    const events = ['pointerup', 'touchend', 'click', 'keydown'];
    const stop = () => events.forEach((t) => window.removeEventListener(t, retry, true));
    const retry = (e) => {
      if (e.target.closest?.('.music-toggle')) return;
      if (!cancelled) start().then(stop, () => {});
    };

    start().catch(() => {
      if (cancelled) return;
      setBlocked(true);
      events.forEach((t) => window.addEventListener(t, retry, true));
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [playing, start]);

  // Call from inside a tap that comes before the score should play (the
  // envelope's): loads it and clears it to play later without another tap.
  // Muted, not volume 0 — iOS ignores volume.
  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.paused || playingRef.current) return;
    audio.preload = 'auto';
    audio.muted = true;
    Promise.resolve(audio.play()).then(
      () => { if (!playingRef.current) audio.pause(); audio.muted = false; },
      () => { audio.muted = false; },
    );
  }, []);

  return { blocked: playing && blocked, start, unlock };
}
