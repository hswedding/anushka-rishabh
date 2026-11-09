import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { selectedEvents, PREVIEW_READY, PREVIEW_GUEST_NAME } from './lib/config.js';
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

export default function App({ invite: link, preview }) {
  // The builder's preview takes the guest name from the builder as it's typed
  // (no reload); anywhere else, only from the link.
  const [previewName, setPreviewName] = useState(link.guestName);
  const invite = preview ? { ...link, guestName: previewName } : link;
  const lastName = useRef(link.guestName);
  useEffect(() => {
    if (!preview || window.parent === window) return;
    const onMessage = (e) => {
      if (e.source !== window.parent || e.origin !== window.location.origin) return;
      if (e.data?.type !== PREVIEW_GUEST_NAME) return;
      const name = String(e.data.name || '').slice(0, 80);
      if (name === lastName.current) return;
      lastName.current = name;
      setPreviewName(name);
      // Scrolled away from the greeting? Bring it back, as a reload used to.
      if (window.scrollY > window.innerHeight / 2) {
        if (window.__lenis) window.__lenis.scrollTo(0);
        else window.scrollTo(0, 0);
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [preview]);

  const events = selectedEvents(invite.eventIds);
  const reduced = useReducedMotion();
  // No envelope for the builder's live preview, or for links that turned it
  // off — those open straight away, and the envelope film never loads.
  const envelope = invite.sections.envelope && !preview;
  const [opened, setOpened] = useState(!envelope);
  // App-wide sound: the looping background score, on by default (the
  // preview is muted). The envelope tap plays the envelope film with its own
  // sound and loads the score, which starts once the film ends and the page
  // is revealed. Without the envelope it starts on the guest's first tap —
  // see useBackgroundMusic.
  const [soundOn, setSoundOn] = useState(!preview);

  // The score runs for the whole page — the event films carry no audio of
  // their own, so nothing ever interrupts it except the toggle.
  const music = useBackgroundMusic(config.bgMusic, soundOn && opened);
  const soundAudible = soundOn && !music.blocked;
  // A tap on the toggle is a gesture, so turning the sound on always works.
  const toggleSound = () => {
    if (soundAudible) { setSoundOn(false); return; }
    setSoundOn(true);
    music.start().catch(() => {});
  };

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

      {envelope && !opened && <Envelope onTap={music.unlock} onOpen={() => setOpened(true)} />}

      <main className="page" id="main-content" aria-hidden={!opened}>
        <Hero invite={invite} />
        {invite.sections.photos && <Photos ready={opened} />}
        <EventFilms events={events} side={invite.side} ready={opened} prefetch={!preview} />
        <Venue events={events} />
        {invite.sections.rsvp && <Rsvp invite={invite} ready={opened} />}
        {customSections.map(({ id, Component }) => (
          <Component key={id} invite={invite} />
        ))}
        <Footer invite={invite} />
      </main>

      {opened && (
        <button
          type="button"
          className="music-toggle"
          onClick={toggleSound}
          aria-label={soundAudible ? 'Mute sound' : 'Play sound'}
          aria-pressed={soundAudible}
        >
          <Icon name={soundAudible ? 'speaker' : 'speakerOff'} size={20} />
        </button>
      )}
    </>
  );
}
