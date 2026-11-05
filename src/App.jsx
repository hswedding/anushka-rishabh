import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { selectedEvents } from './lib/config.js';
import { config } from './data.js';
import { gsap, ScrollTrigger } from './lib/gsap.js';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import useBackgroundMusic from './hooks/useBackgroundMusic.js';

import Envelope from './sections/Envelope.jsx';
import Hero from './sections/Hero.jsx';
import Photos from './sections/Photos.jsx';
import EventFilms from './sections/EventFilms.jsx';
import Venue from './sections/Venue.jsx';
import Rsvp from './sections/Rsvp.jsx';
import Footer from './sections/Footer.jsx';
import Petals from './components/Petals.jsx';
import Icon from './components/Icons.jsx';
import customSections from './custom/index.js';

export default function App({ invite, preview }) {
  const events = selectedEvents(invite.eventIds);
  const reduced = useReducedMotion();
  // No envelope for the builder's live preview, or for links that turned it
  // off — those open straight away, and the envelope film never loads.
  const envelope = invite.sections.envelope && !preview;
  const [opened, setOpened] = useState(!envelope);
  // App-wide sound: the looping background score. On by default — browsers
  // only let audio start after a tap, so it starts at the reveal if the guest
  // tapped during the envelope film, else on their first tap. The preview is
  // muted.
  const [soundOn, setSoundOn] = useState(!preview);
  // The envelope film has started — the score buffers while it plays.
  const [filmStarted, setFilmStarted] = useState(false);

  // The score runs for the whole page — the films carry no audio of their own,
  // so nothing ever interrupts it except the toggle.
  // A tap during the envelope film unlocks it, so it starts at the reveal.
  const unlockMusic = useBackgroundMusic(config.bgMusic, opened && soundOn, filmStarted);

  // Lock scroll behind the envelope; refresh scroll positions once revealed.
  useEffect(() => {
    // iOS ignores overflow:hidden on body alone — lock html too.
    document.documentElement.style.overflow = opened ? '' : 'hidden';
    document.body.style.overflow = opened ? '' : 'hidden';
    if (opened) {
      const t = setTimeout(() => ScrollTrigger.refresh(), 120);
      return () => clearTimeout(t);
    }
  }, [opened]);

  // Buttery smooth scrolling (Lenis) synced with GSAP ScrollTrigger.
  useEffect(() => {
    if (!opened || reduced) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true });
    window.__lenis = lenis; // programmatic scrolls must go through lenis.scrollTo
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [opened, reduced]);

  return (
    <>
      <Petals active={opened} />

      {envelope && !opened && <Envelope onStart={() => setFilmStarted(true)} onTap={unlockMusic} onOpen={() => setOpened(true)} />}

      <main className="page" id="main-content" aria-hidden={!opened}>
        <Hero invite={invite} />
        {invite.sections.photos && <Photos />}
        <EventFilms events={events} side={invite.side} ready={opened} />
        <Venue events={events} />
        {invite.sections.rsvp && <Rsvp invite={invite} />}
        {customSections.map(({ id, Component }) => (
          <Component key={id} invite={invite} />
        ))}
        <Footer invite={invite} />
      </main>

      {opened && (
        <button
          type="button"
          className="music-toggle"
          onClick={() => setSoundOn((s) => !s)}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          aria-pressed={soundOn}
        >
          <Icon name={soundOn ? 'speaker' : 'speakerOff'} size={20} />
        </button>
      )}
    </>
  );
}
