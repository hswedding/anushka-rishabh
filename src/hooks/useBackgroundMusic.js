import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';

/* App-wide background score — one looped <audio> element that follows the
   global sound toggle in App.jsx. Fades in/out so it never snaps on.

   Autoplay with sound needs a user gesture: for guests the envelope tap
   provides it, so playback starts the moment the page is revealed. The host
   preview skips the envelope, so if the browser blocks the first attempt we
   retry on the first interaction instead.

   Nothing is fetched until `buffer` turns on (the envelope tap) or playback
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
    let retry = null;
    const fadeIn = () => { if (!cancelled) gsap.to(audio, { volume, duration: 1.4 }); };
    // Older Safari returns undefined from play() instead of a promise.
    const attempt = () => Promise.resolve(audio.play()).then(fadeIn);

    attempt().catch(() => {
      if (cancelled) return;
      retry = () => { attempt().catch(() => {}); };
      window.addEventListener('pointerdown', retry, { once: true });
    });

    return () => {
      cancelled = true;
      if (retry) window.removeEventListener('pointerdown', retry);
    };
  }, [playing, volume]);
}
