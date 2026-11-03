import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import Icon from '../components/Icons.jsx';

/* Scene 4b — Invitation films. Each function that carries a `video` is shown
   as its own cinematic scene: the Canva invitation film in an ornate gold
   frame. A film starts the moment it scrolls into view, then plays through
   once — scrolling away never pauses it — and holds its last frame, which
   carries all the details. The films have no audio, so they stay muted
   (which also keeps autoplay allowed) and the background score plays over
   them. */

function Film({ event, src: preloaded, ready, onStart }) {
  const wrap = useRef(null);
  const videoRef = useRef(null);
  const reduced = useReducedMotion();
  // idle → loading → playing → ended; 'blocked' when the browser refuses
  // autoplay (iOS Low Power Mode, data saver) and the guest has to tap.
  const [state, setState] = useState('idle');
  // The source is fixed once playback starts, so a download that lands
  // later never reloads a film mid-play.
  const [lockedSrc, setLockedSrc] = useState(null);
  const src = lockedSrc ?? preloaded ?? event.video;

  const play = () => {
    setState('loading');
    videoRef.current.play().catch(() => setState('blocked'));
  };

  // Start once 40% of the film is on screen — one time only.
  useEffect(() => {
    const video = videoRef.current;
    if (!ready || reduced || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.4) return;
      io.disconnect();
      setLockedSrc(video.getAttribute('src'));
      onStart(event.video);
      play();
    }, { threshold: 0.4 });
    io.observe(video);
    return () => io.disconnect();
  }, [ready, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  useGSAP(() => {
    gsap.from(wrap.current.querySelectorAll('.film__reveal'), {
      scrollTrigger: { trigger: wrap.current, start: 'top 72%' },
      y: 32, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    });
    gsap.from(wrap.current.querySelector('.film__frame'), {
      scrollTrigger: { trigger: wrap.current, start: 'top 68%' },
      scale: 0.94, duration: 1.1, ease: 'power3.out',
    });
  }, { scope: wrap });

  return (
    <section className="film section" id={`film-${event.id}`} ref={wrap}>
      <div className="section__inner film__inner">
        <h2 className="display film__reveal">{event.name}</h2>
        {event.nameDeva && <p className="film__deva film__reveal" lang="hi">{event.nameDeva}</p>}
        <p className="film__date film__reveal">{event.dayLabel}, {event.dateLabel}</p>

        <div className="film__frame film__reveal" data-state={state} aria-busy={state === 'loading'}>
          <video
            ref={videoRef}
            className="film__video"
            src={src}
            muted
            playsInline
            // a downloaded film is already on the phone — let it show its first frame
            preload={src.startsWith('blob:') ? 'auto' : 'none'}
            controls={reduced}
            onWaiting={() => setState((s) => (s === 'playing' ? 'loading' : s))}
            onPlaying={() => setState('playing')}
            onEnded={() => setState('ended')}
            aria-label={`${event.name} invitation film`}
          />
          <span className="film__sheen" aria-hidden="true" />
          {state === 'blocked' && (
            <button type="button" className="btn film__play" onClick={play}
              aria-label={`Play the ${event.name} film`}>
              <Icon name="play" size={18} /> Play film
            </button>
          )}
        </div>

        <p className="film__meta film__reveal">
          <Icon name="location" size={16} />
          <a href={event.venue?.mapUrl} target="_blank" rel="noopener noreferrer">
            {event.venue?.name}
          </a>
        </p>
      </div>
    </section>
  );
}

export default function EventFilms({ events, side, ready }) {
  // `video` is a single film; `videoBySide` holds one per hosting side —
  // side variants get their own, joint shows both (groom first, like the hero).
  const films = events.flatMap((e) => {
    if (e.video) return [e];
    if (!e.videoBySide) return [];
    const sides = side === 'bride' || side === 'groom' ? [side] : ['groom', 'bride'];
    return sides
      .filter((s) => e.videoBySide[s])
      .map((s) => ({ ...e, id: sides.length > 1 ? `${e.id}-${s}` : e.id, video: e.videoBySide[s] }));
  });
  const queue = films.map((e) => e.video).join('|');

  // Once the invitation is open, download every film in full, one at a time
  // in page order, so each is on the phone before the guest reaches it —
  // `preload` alone isn't enough (iOS ignores it). A film reached before its
  // turn streams straight away instead and is skipped here.
  const [downloaded, setDownloaded] = useState({});
  const started = useRef(new Set());
  useEffect(() => {
    if (!ready || !queue) return;
    const ctrl = new AbortController();
    const urls = [];
    (async () => {
      for (const video of new Set(queue.split('|'))) {
        if (started.current.has(video)) continue;
        try {
          const res = await fetch(video, { signal: ctrl.signal });
          if (!res.ok) continue;
          const url = URL.createObjectURL(await res.blob());
          urls.push(url);
          setDownloaded((d) => ({ ...d, [video]: url }));
        } catch {
          if (ctrl.signal.aborted) return; // otherwise that film just streams
        }
      }
    })();
    return () => { ctrl.abort(); urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [ready, queue]);

  if (!films.length) return null;
  return films.map((e) => (
    <Film key={e.id} event={e} src={downloaded[e.video]} ready={ready}
      onStart={(video) => started.current.add(video)} />
  ));
}
