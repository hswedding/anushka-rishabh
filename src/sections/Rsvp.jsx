import { lazy, Suspense, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { gsap, useGSAP } from '../lib/gsap.js';
import { config, host } from '../data.js';
import { buildRsvpWhatsApp } from '../lib/config.js';
import Icon from '../components/Icons.jsx';

// The phone field's library and country data are a third of the page's JS, so
// they load on their own — fetched as the page mounts, long before a guest
// scrolls down here. The fallback is the same-sized input, so nothing shifts.
const PhoneInput = lazy(() => import('react-phone-number-input'));

/* Scene 6 — RSVP. Validates client-side, fires confetti, then opens a
   pre-filled WhatsApp message to the hosts (no backend). */
export default function Rsvp({ invite }) {
  const root = useRef(null);
  const rsvpNumber = host.rsvpWhatsApp || config.rsvpWhatsApp;
  const [form, setForm] = useState({
    name: '', phone: '', party: 1, arrival: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success

  useGSAP(() => {
    gsap.from('.rsvp__panel', {
      scrollTrigger: { trigger: root.current, start: 'top 80%' },
      y: 28, autoAlpha: 0, duration: 0.8, ease: 'power3.out',
    });
  }, { scope: root });

  const set = (k) => (v) =>
    setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please tell us your name.';
    if (!form.phone || form.phone.length < 8) e.phone = 'Add a valid phone number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const celebrate = () => {
    const fire = (ratio, opts) =>
      confetti({ ...opts, origin: { y: 0.7 }, particleCount: Math.floor(180 * ratio),
        colors: ['#b39257', '#dcc594', '#f3ebd8', '#8fa58a', '#3e5141'] });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.35, { spread: 60 });
    fire(0.2, { spread: 100, decay: 0.91, scalar: 0.9 });
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    const url = buildRsvpWhatsApp(rsvpNumber, form);
    setTimeout(() => {
      setStatus('success');
      celebrate();
      window.open(url, '_blank', 'noopener');
    }, 700);
  };

  return (
    <section className="rsvp section" id="rsvp-section" ref={root}>
      <div className="section__inner">
        <h2 className="display">Will you join us?</h2>
        <p className="rsvp__lead">
          Kindly respond so we can celebrate with you. Your reply opens WhatsApp,
          pre-filled — just press send.
        </p>

        {status === 'success' ? (
          <div className="rsvp__panel rsvp__success card" role="status">
            <span className="rsvp__check"><Icon name="check" size={40} /></span>
            <h3 className="serif-h">Thank you, {form.name.split(' ')[0]}!</h3>
            <p>If WhatsApp didn’t open, tap below to send your RSVP.</p>
            <a className="btn btn--primary" href={buildRsvpWhatsApp(rsvpNumber, form)}
              target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} /> Send on WhatsApp
            </a>
          </div>
        ) : (
          <form className="rsvp__panel card" onSubmit={onSubmit} noValidate>
            <Field id="name" label="Your name" error={errors.name} required>
              <input id="name" className="field__input" type="text" autoComplete="name"
                value={form.name} onChange={set('name')} />
            </Field>

            <div className={`field ${errors.phone ? 'field--error' : ''}`}>
              <label className="field__label" htmlFor="phone">Phone <span aria-hidden>*</span></label>
              <Suspense fallback={
                <div className="PhoneInput rsvp__phone">
                  <input id="phone" className="PhoneInputInput" type="tel" disabled />
                </div>
              }>
                <PhoneInput
                  id="phone" international defaultCountry="IN" value={form.phone}
                  onChange={(v) => set('phone')(v || '')} className="rsvp__phone" />
              </Suspense>
              {errors.phone && <p className="field__err" role="alert">{errors.phone}</p>}
            </div>

            <Field id="party" label="Number of guests">
              <input id="party" className="field__input" type="number" inputMode="numeric"
                min="1" max="20" value={form.party} onChange={set('party')} />
            </Field>

            <Field id="arrival" label="Date of arrival">
              <input id="arrival" className="field__input" type="date"
                value={form.arrival} onChange={set('arrival')} />
            </Field>

            <button type="submit" className="btn btn--primary rsvp__submit"
              disabled={status === 'sending'}>
              {status === 'sending'
                ? 'Sending…'
                : <><Icon name="whatsapp" size={18} /> Send RSVP</>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ id, label, error, required, children }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label} {required && <span aria-hidden>*</span>}
      </label>
      {children}
      {error && <p className="field__err" role="alert">{error}</p>}
    </div>
  );
}
