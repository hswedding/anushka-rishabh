import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';

/* App-wide background score — one looped <audio> element that follows the
   global sound toggle in App.jsx. Fades in/out so it never snaps on.

   Autoplay with sound needs a user gesture. The envelope film plays by itself
   (muted), so there's no tap to open it. The returned `unlock` is for a tap
   that comes before the music should play (one during the envelope film): it
   starts the score silently inside that gesture and pauses it again, which
   lets it play later without another tap. Otherwise the browser blocks the
   first attempt and we retry on each tap or key press until one is allowed —
   a scroll doesn't count, so we keep listening. A tap on the sound toggle
   itself is left to the toggle.

   Nothing is fetched until `buffer` turns on (the envelope film starts) or playback
   starts, so the score never competes with the envelope film for bandwidth;
   the film's run is ample time for it to be ready by the reveal.

   Phones keep a page's audio going after the guest leaves the browser, so the
   score stops while the page is hidden and fades back in on return. */
export default function useBackgroundMusic(src, playing, buffer, volume = 0.35) {
  const audioRef = useRef(null);
  const [visible, setVisible] = useState(!document.hidden);

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

  useEffect(() => {
    if (buffer && audioRef.current) audioRef.current.preload = 'auto';
  }, [buffer, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    gsap.killTweensOf(audio);

    if (!playing) {
      gsap.to(audio, { volume: 0, duration: 0.4, onComplete: () => audio.pause() });
      return;
    }

    let cancelled = false;
    const fadeIn = () => { if (!cancelled) gsap.to(audio, { volume, duration: 1.4 }); };
    // Older Safari returns undefined from play() instead of a promise.
    const attempt = () => Promise.resolve(audio.play()).then(fadeIn);

    // pointerup, not pointerdown: a touch only counts as a gesture on release.
    const events = ['pointerup', 'keydown'];
    const stop = () => events.forEach((t) => window.removeEventListener(t, retry));
    const retry = (e) => {
      if (e.target.closest?.('.music-toggle')) return;
      attempt().then(stop, () => {});
    };

    attempt().catch(() => {
      if (!cancelled) events.forEach((t) => window.addEventListener(t, retry));
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [playing, volume]);

  // Call from inside a tap: plays the score at zero volume for a moment so
  // the browser counts it as started by the guest, then pauses it again
  // unless it should be playing by then.
  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.paused || playingRef.current) return;
    audio.volume = 0;
    Promise.resolve(audio.play()).then(() => {
      if (!playingRef.current) audio.pause();
    }, () => {});
  }, []);
}
