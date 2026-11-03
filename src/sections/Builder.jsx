import { useEffect, useState } from 'react';
import { events, presets, toggleableSections, config, host } from '../data.js';
import {
  presetState, buildQuery, sharePath, siteUrl, buildWhatsAppShare, orderedCouple,
} from '../lib/config.js';
import Icon from '../components/Icons.jsx';

// A `comesWith` event has no checkbox of its own: it joins its partner on the page.
const choosable = events.filter((e) => !e.comesWith);

/* Invitation builder — its own page at /{links.builder}. Pick what a guest
   sees (the hosting side is fixed for this single-family site); a live
   preview renders the real invitation and the share bar builds their link. */
export default function Builder() {
  const [state, setState] = useState(() => ({ ...presetState('all'), guestName: '' }));
  const [view, setView] = useState('edit'); // mobile: edit | preview
  const [copied, setCopied] = useState(null);

  useEffect(() => { document.title = 'Invitation Builder'; }, []);

  const path = sharePath(state);
  const shareUrl = siteUrl(path);
  const names = orderedCouple().map((c) => c.first).join(' & ');
  const waHref = buildWhatsAppShare(shareUrl, state.guestName.trim(), names, host.waSignoff);
  const empty = state.eventIds.length === 0;
  const everyoneUrl = siteUrl(`/${config.links.all}`);

  // reload the preview only once typing/toggling settles
  const [previewPath, setPreviewPath] = useState(path);
  useEffect(() => {
    const t = setTimeout(() => setPreviewPath(path), 450);
    return () => clearTimeout(t);
  }, [path]);

  // the preset the current selection matches, if any (guest name aside)
  const current = buildQuery({ ...state, guestName: '' });
  const activePreset = Object.keys(presets).find(
    (k) => buildQuery({ ...presetState(k), guestName: '' }) === current
  );

  const applyPreset = (key) => setState((s) => ({ ...s, ...presetState(key) }));
  const toggleEvent = (id) =>
    setState((s) => ({
      ...s,
      eventIds: s.eventIds.includes(id)
        ? s.eventIds.filter((x) => x !== id)
        : [...s.eventIds, id],
    }));
  const toggleSection = (id) =>
    setState((s) => ({ ...s, sections: { ...s.sections, [id]: !s.sections[id] } }));

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800);
    } catch { /* clipboard blocked — the link is still selectable */ }
  };

  return (
    <div className="builder" data-view={view}>
      <header className="builder__bar">
        <h1 className="builder__title"><Icon name="sparkle" size={18} /> Invitation Builder</h1>
        <div className="builder__tabs" role="tablist" aria-label="Builder view">
          {['edit', 'preview'].map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v}
              className={view === v ? 'is-on' : ''} onClick={() => setView(v)}>
              {v === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>
      </header>

      <div className="builder__main">
        <div className="builder__form">
          <label className="panel__field">
            <span>Guest name <small>(optional — personalises the greeting)</small></span>
            <input
              type="text" value={state.guestName}
              placeholder="e.g. Sharma Family"
              onChange={(e) => setState((s) => ({ ...s, guestName: e.target.value }))}
            />
          </label>

          <div className="panel__group">
            <span className="panel__group-label">Quick presets</span>
            <div className="panel__presets">
              {Object.entries(presets).map(([key, p]) => (
                <button key={key} type="button"
                  className={`panel__preset${activePreset === key ? ' is-on' : ''}`}
                  aria-pressed={activePreset === key}
                  onClick={() => applyPreset(key)}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="panel__group">
            <span className="panel__group-label">
              Functions ({state.eventIds.length}/{choosable.length})
            </span>
            <ul className="panel__checks">
              {choosable.map((e) => (
                <li key={e.id}>
                  <label className={state.eventIds.includes(e.id) ? 'is-on' : ''}>
                    <input type="checkbox" checked={state.eventIds.includes(e.id)}
                      onChange={() => toggleEvent(e.id)} />
                    <span className="panel__check-dot" style={{ background: e.dressCode.color }} />
                    <span className="panel__check-name">{e.name}</span>
                    <small>{e.dateLabel}</small>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel__group">
            <span className="panel__group-label">Sections</span>
            <ul className="panel__checks panel__checks--inline">
              {toggleableSections.map((s) => (
                <li key={s.id}>
                  <label className={state.sections[s.id] ? 'is-on' : ''}>
                    <input type="checkbox" checked={!!state.sections[s.id]}
                      onChange={() => toggleSection(s.id)} />
                    <span className="panel__check-name">{s.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <details className="panel__group builder__ready">
            <summary className="panel__group-label">Ready-made link</summary>
            <p className="panel__note">
              One link with every function — handy for family WhatsApp groups.
            </p>
            <ul className="builder__ready-list">
              <li>
                <span>Everyone (all functions)</span>
                <button type="button" className="btn btn--sm" onClick={() => copy('all', everyoneUrl)}>
                  <Icon name={copied === 'all' ? 'check' : 'copy'} size={16} />
                  {copied === 'all' ? 'Copied' : 'Copy'}
                </button>
              </li>
            </ul>
          </details>
        </div>

        <aside className="builder__preview" aria-label="Live preview">
          <div className="builder__phone">
            <iframe title="Invitation preview" src={`${previewPath}#preview`} />
          </div>
        </aside>
      </div>

      <footer className="builder__share">
        <input
          type="text" readOnly value={empty ? 'Pick at least one function' : shareUrl}
          aria-label="Shareable link" onFocus={(e) => e.target.select()}
        />
        <div className="panel__actions">
          <button type="button" className="btn" disabled={empty} onClick={() => copy('share', shareUrl)}>
            <Icon name={copied === 'share' ? 'check' : 'copy'} size={18} />
            {copied === 'share' ? 'Copied' : 'Copy link'}
          </button>
          <a className="btn btn--primary" href={empty ? undefined : waHref}
            aria-disabled={empty} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={18} /> Send on WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
