import { useEffect, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import Icon from '../components/Icons.jsx';

/* Scene 4b — Invitation films. Each function that carries a `video` is shown
   as its own cinematic scene: the Canva invitation film in an ornate gold
   frame that starts playing the moment it scrolls into view and pauses when
   it leaves. The markup is muted (autoplay policy); the app-wide sound toggle
   in App.jsx unmutes every film at once. The films carry no audio of their
   own, so they play over the background score rather than replacing it. */

function Film({ event, soundOn, ready }) {
  const wrap = useRef(null);
  const videoRef = useRef(null);
  const reduced = useReducedMotion();

  // React doesn't update the muted attribute after mount — set it directly.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn;
  }, [soundOn]);

  // Buffer a screen ahead, so each film is ready by the time it scrolls in —
  // and only once the invitation is open, so none compete with the envelope.
  useEffect(() => {
    const video = videoRef.current;
    if (!ready || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      video.preload = 'auto';
      io.disconnect();
    }, { rootMargin: '100% 0px' });
    io.observe(video);
    return () => io.disconnect();
  }, [ready]);

  // Autoplay / pause driven by visibility.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
          if (!reduced) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.4] }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced]);

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
        <p className="eyebrow film__reveal">{event.dateLabel} · {event.dayLabel}</p>
        <h2 className="display film__reveal">{event.name}</h2>

        <div className="film__frame film__reveal">
          <video
            ref={videoRef}
            className="film__video"
            src={event.video}
            muted
            loop
            playsInline
            preload="none"
            controls={reduced}
            aria-label={`${event.name} invitation film`}
          />
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

export default function EventFilms({ events, side, soundOn, ready }) {
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
  if (!films.length) return null;
  return films.map((e) => <Film key={e.id} event={e} soundOn={soundOn} ready={ready} />);
}
