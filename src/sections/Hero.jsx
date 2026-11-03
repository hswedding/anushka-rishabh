import { Fragment, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap.js';
import { wedding, host, config } from '../data.js';
import { orderedCouple } from '../lib/config.js';
import Icon from '../components/Icons.jsx';
import floralLeft from '../Images/decor/floral-corner-left.webp';
import floralRight from '../Images/decor/floral-corner-right.webp';
import wash from '../Images/decor/wash.webp';
import ganesha from '../Images/ganesha.webp';

/* "Smt. A & Sh. B" may only wrap after the "&", never inside a person's name. */
const keepNames = (text) => text.split(' & ').map((name, i, all) => (
  <Fragment key={i}>
    <span className="hero__name-run">{name}{i < all.length - 1 && ' &'}</span>
    {i < all.length - 1 && ' '}
  </Fragment>
));

/* Keep the "॥" / "।" dandas glued to their neighbouring word so a line never
   starts or ends on a stray danda when the blessing wraps on a phone. */
const glueDandas = (text) => text.replace(/(॥|।) /g, '$1\u00a0').replace(/ (॥|।)/g, '\u00a0$1');

/* Scene 1 — the invitation card. Opens with the Ganesha invocation (Indian
   fusion), who is inviting, the couple's names and the wedding date. */
export default function Hero({ invite }) {
  const root = useRef(null);
  const family = host;
  const [first, second] = orderedCouple(invite.side);

  useGSAP(() => {
    gsap.from('.hero__reveal', {
      y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15,
    });
  }, { scope: root });

  const scrollToNext = () => {
    const next = root.current?.nextElementSibling;
    if (!next) return;
    if (window.__lenis) window.__lenis.scrollTo(next);
    else next.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="hero section" id="hero" ref={root}>
      <img className="decor decor--hero-tl" src={floralLeft} alt="" aria-hidden="true" />
      <img className="decor decor--hero-br" src={floralRight} alt="" aria-hidden="true" />
      <img className="decor decor--hero-wash" src={wash} alt="" aria-hidden="true" />
      <div className="section__inner hero__inner">
        {config.showGanesha && (
          <img className="hero__ganesha hero__reveal" src={ganesha} alt="Lord Ganesha" />
        )}
        {family.ganesha && (
          <p className="hero__invocation hero__reveal" lang="sa">
            {family.ganesha.map((line, i) => (
              <span key={i} className="hero__invocation-line">{glueDandas(line)}</span>
            ))}
          </p>
        )}
        {family.invocation && (
          <p className="hero__invocation hero__reveal" lang="hi">{family.invocation}</p>
        )}

        {invite.guestName && (
          <p className="hero__guest hero__reveal">Dear {invite.guestName},</p>
        )}

        <p className="hero__hosts hero__reveal">{keepNames(family.hosts)}</p>
        <p className="hero__line hero__reveal">{family.inviteLine}</p>

        <h1 className="hero__names hero__reveal">
          <span>{first.first}</span>
          {family.parents?.[first.role] && (
            <span className="hero__parents">{keepNames(family.parents[first.role])}</span>
          )}
          <span className="hero__amp">&amp;</span>
          <span>{second.first}</span>
          {family.parents?.[second.role] && (
            <span className="hero__parents">{keepNames(family.parents[second.role])}</span>
          )}
        </h1>

        <p className="hero__date hero__reveal">
          <span className="hero__date-day">{wedding.dayLabel}</span>
          <span className="hero__date-main">{wedding.dateLabel}</span>
        </p>
      </div>

      <button
        type="button"
        className="hero__scroll hero__reveal"
        onClick={scrollToNext}
        aria-label="Scroll down to see the celebrations"
      >
        <span>Scroll to explore</span>
        <Icon name="chevronDown" size={20} />
      </button>
    </header>
  );
}
