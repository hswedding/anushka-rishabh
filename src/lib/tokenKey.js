// Never change TOKEN_KEY: every guest link already sent is scrambled with it.
// Its own module so vite.config.js can read it too: the inline script it
// writes into index.html decodes the path to skip the envelope poster
// preload on envelope=0 links.
export const TOKEN_KEY = 'hs-wedding-invites';
