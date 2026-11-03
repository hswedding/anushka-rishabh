/* Inline SVG icons — vector, themeable via currentColor, consistent 1.6 stroke.
   (ui-ux-pro-max rule: no emoji as structural icons.) */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const paths = {
  /* --- function motifs --- */
  kirtan: ( // diya / oil lamp
    <>
      <path {...S} d="M4 14c0 0 3 3 8 3s8-3 8-3-3-2-8-2-8 2-8 2Z" />
      <path {...S} d="M12 12V8" />
      <path {...S} d="M12 8c0-1.6 1.8-2 1.8-3.6C13.8 3 12 2.5 12 2.5s-1.8.5-1.8 1.9C10.2 6 12 6.4 12 8Z" />
      <path {...S} d="M7 17l1.5 3M17 17l-1.5 3M12 17v3.5" />
    </>
  ),
  mehndi: ( // henna hand
    <>
      <path {...S} d="M9 21v-4M9 17c-1.2 0-2-1-2-2.4V10M12 21V8M15 21v-5M15 16c1.2 0 2-1 2-2.4V11" />
      <path {...S} d="M7 11c0-1 .5-1.6 1.4-1.6M17 11c0-1-.5-1.6-1.4-1.6" />
      <circle {...S} cx="12" cy="13" r="1.1" />
    </>
  ),
  path: ( // open book / scripture
    <>
      <path {...S} d="M12 6c-1.8-1.2-4-1.6-6.5-1.6V18c2.5 0 4.7.4 6.5 1.6 1.8-1.2 4-1.6 6.5-1.6V4.4C16 4.4 13.8 4.8 12 6Z" />
      <path {...S} d="M12 6v13.6" />
    </>
  ),
  sangeet: ( // musical notes
    <>
      <path {...S} d="M9 17V5l9-2v12" />
      <circle {...S} cx="6.5" cy="17" r="2.5" />
      <circle {...S} cx="15.5" cy="15" r="2.5" />
    </>
  ),
  haldi: ( // sun / marigold
    <>
      <circle {...S} cx="12" cy="12" r="4" />
      <path {...S} d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  chooda: ( // bangles
    <>
      <ellipse {...S} cx="10" cy="12" rx="3.2" ry="5" />
      <ellipse {...S} cx="14.4" cy="12" rx="3.2" ry="5" />
    </>
  ),
  baarat: ( // festive canopy / sehra
    <>
      <path {...S} d="M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6" />
      <path {...S} d="M4 10h16l-2.5 3H6.5L4 10Z" />
      <path {...S} d="M12 13v7M9 20h6" />
    </>
  ),
  wedding: ( // interlocking rings
    <>
      <circle {...S} cx="9" cy="14" r="5" />
      <circle {...S} cx="15" cy="14" r="5" />
      <path {...S} d="M9 9l1.5-3h3L15 9" />
    </>
  ),

  /* --- UI glyphs --- */
  heart: <path {...S} d="M12 20s-7-4.3-9.3-8.4C1 8.4 2.5 5 6 5c2 0 3.2 1.3 4 2.4C10.8 6.3 12 5 14 5c3.5 0 5 3.4 3.3 6.6C19 15.7 12 20 12 20Z" />,
  lotus: (
    <>
      <path {...S} d="M12 21c-4 0-7-2.4-7-5.5 0 0 3 .5 4.5 2C10 14 11 11 12 9c1 2 2 5 2.5 8.5C16 16 19 15.5 19 15.5 19 18.6 16 21 12 21Z" />
      <path {...S} d="M12 9C9.5 11 7 12.5 5 15.5M12 9c2.5 2 5 3.5 7 6.5" />
    </>
  ),
  sparkle: <path {...S} d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />,
  chevronDown: <path {...S} d="M6 9l6 6 6-6" />,
  location: (
    <>
      <path {...S} d="M12 21c4-4.5 7-7.6 7-11a7 7 0 1 0-14 0c0 3.4 3 6.5 7 11Z" />
      <circle {...S} cx="12" cy="10" r="2.4" />
    </>
  ),
  calendar: (
    <>
      <rect {...S} x="4" y="5" width="16" height="16" rx="2" />
      <path {...S} d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  phone: <path {...S} d="M5 4h3.5l1.8 4.4-2.3 1.4a11 11 0 0 0 6.2 6.2l1.4-2.3L20 15.5V19a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />,
  close: <path {...S} d="M6 6l12 12M18 6L6 18" />,
  copy: (
    <>
      <rect {...S} x="9" y="9" width="11" height="11" rx="2" />
      <path {...S} d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  check: <path {...S} d="M5 13l4 4L19 7" />,
  link: <path {...S} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5" />,
  eye: (
    <>
      <path {...S} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle {...S} cx="12" cy="12" r="3" />
    </>
  ),
  whatsapp: ( // simplified WhatsApp glyph (filled)
    <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.6-4.1-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6-.1 1.2Z" />
  ),
  speaker: (
    <>
      <path {...S} d="M4 10v4h3l4 3V7L7 10H4Z" />
      <path {...S} d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
    </>
  ),
  speakerOff: (
    <>
      <path {...S} d="M4 10v4h3l4 3V7L7 10H4Z" />
      <path {...S} d="M16 9.5l4 5M20 9.5l-4 5" />
    </>
  ),
  arrowDown: <path {...S} d="M12 5v14M6 13l6 6 6-6" />,
  pause: <path {...S} d="M9 6v12M15 6v12" />,
  play: <path {...S} d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
};

export default function Icon({ name, size = 24, className, title }) {
  const glyph = paths[name] || paths.sparkle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
