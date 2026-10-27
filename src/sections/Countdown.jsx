import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap.js';
import { wedding } from '../data.js';
import feather from '../Images/decor/feather.webp';
import divider from '../Images/decor/divider.webp';

const target = new Date(wedding.dateTimeISO).getTime();

function diff() {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, done: ms === 0 };
}

/* Scene 2 — countdown to the wedding datetime. */
export default function Countdown() {
  const root = useRef(null);
  const [t, setT] = useState(diff);

  useEffect(() => {
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(() => {
    gsap.from('.countdown__cell', {
      scrollTrigger: { trigger: root.current, start: 'top 78%' },
      y: 22, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
    });
  }, { scope: root });

  const cells = [
    { n: t.d, l: 'Days' },
    { n: t.h, l: 'Hours' },
    { n: t.m, l: 'Minutes' },
    { n: t.s, l: 'Seconds' },
  ];

  return (
    <section className="countdown section" id="countdown-section" ref={root}>
      <img className="decor decor--countdown" src={feather} alt="" aria-hidden="true" loading="lazy" />
      <div className="section__inner">
        <p className="eyebrow">The Date</p>
        <h2 className="display">{t.done ? 'We’re Married!' : 'Counting Down'}</h2>
        {!t.done && (
          <div className="countdown__grid" role="timer" aria-live="off">
            {cells.map((c) => (
              <div className="countdown__cell card" key={c.l}>
                <span className="countdown__num">{String(c.n).padStart(2, '0')}</span>
                <span className="countdown__label">{c.l}</span>
              </div>
            ))}
          </div>
        )}
        <p className="countdown__sub">{wedding.dayLabel}, {wedding.dateLabel}</p>
        <img className="decor-divider" src={divider} alt="" aria-hidden="true" loading="lazy" />
      </div>
    </section>
  );
}
