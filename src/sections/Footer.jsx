import { couple, host, studio } from '../data.js';
import Icon from '../components/Icons.jsx';
import palace from '../Images/decor/palace.webp';

/* Footer — gratitude, family contacts, and hashtag. */
export default function Footer({ invite }) {
  const family = host;

  return (
    <footer className="footer section" id="footer-section">
      <img className="decor decor--footer" src={palace} alt="" aria-hidden="true" loading="lazy" />
      <div className="section__inner">
        <Icon name="lotus" size={30} className="footer__crest" />
        <h2 className="display footer__thanks">Thank You</h2>
        <p className="footer__sign">{family.sign}</p>

        <div className="divider" aria-hidden="true"><Icon name="sparkle" size={16} /></div>

        <ul className="footer__contacts">
          {family.contacts.map((c) => (
            <li key={c.phone}>
              <a href={`tel:${c.phone}`}>{c.name}</a>
            </li>
          ))}
        </ul>

        <p className="footer__hashtag">{couple.hashtag}</p>

        <p className="footer__credit">
          Made with <span className="footer__heart" aria-hidden="true">♥</span><span className="sr-only">love</span> by {studio.name}
          <span className="footer__credit-sep" aria-hidden="true">|</span>
          <a
            className="footer__credit-cta"
            href={studio.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {studio.cta}
          </a>
        </p>
      </div>
    </footer>
  );
}
