import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { site, config } from './src/data.js'
import { TOKEN_KEY } from './src/lib/tokenKey.js'

// Single-page wedding invitation. No router, no SSR — mirrors the Invifest reference.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Writes the page title, description, link-preview tags and robots into
 *  index.html from `site` in src/data.js, plus the envelope poster preload
 *  from `config.envelopePoster` (skipped on envelope=0 links), so a new
 *  couple only edits data.js.
 *  (Restart `npm run dev` after changing `site` — the dev server reads it
 *  once.) The optional analytics beacon is added by src/main.jsx. */
function siteMeta() {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      // WhatsApp and other crawlers ignore relative og:image URLs.
      const shareImage = /^https?:\/\//.test(site.shareImage) || !site.url
        ? site.shareImage
        : site.url.replace(/\/$/, '') + site.shareImage
      const tags = [
        `<meta name="theme-color" content="${esc(site.themeColor)}" />`,
        `<title>${esc(site.title)}</title>`,
        `<meta name="description" content="${esc(site.description)}" />`,
        site.noindex && `<meta name="robots" content="noindex, nofollow" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:title" content="${esc(site.shareTitle)}" />`,
        `<meta property="og:description" content="${esc(site.shareDescription)}" />`,
        `<meta property="og:image" content="${esc(shareImage)}" />`,
        `<meta property="og:image:type" content="image/jpeg" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(site.shareTitle)}" />`,
        `<meta name="twitter:description" content="${esc(site.shareDescription)}" />`,
        `<meta name="twitter:image" content="${esc(shareImage)}" />`,
      ].filter(Boolean)
      // The envelope's first frame, preloaded so the opening screen paints
      // whole — except for the builder preview and for guest links that turned
      // the envelope off (envelope=0 inside the token, decoded as in
      // src/lib/config.js with TOKEN_KEY), which never show it.
      const poster = config.envelopePoster
        ? `<script>
      (function () {
        if (location.hash === '#preview') return;
        try {
          var k = ${JSON.stringify(TOKEN_KEY)}, q = '';
          // the token is the path's last segment (after any base path)
          var t = location.pathname.split('/').filter(Boolean).pop() || '';
          var b = atob(t.replace(/-/g, '+').replace(/_/g, '/'));
          for (var i = 4; i < b.length; i++) q += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length));
          if (/(^|&)envelope=0(&|$)/.test(q)) return;
        } catch (e) { /* not a token — a fixed link, so it has the envelope */ }
        var l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.type = 'image/webp';
        l.href = ${JSON.stringify(config.envelopePoster)};
        document.head.appendChild(l);
      })();
    </script>`
        : ''
      return html
        .replace('<!--SITE_META-->', tags.join('\n    '))
        .replace('<!--ENVELOPE_POSTER-->', poster)
    },
  }
}

/** After each build, records the size of every film/music file in dist/ into
 *  worker/media-sizes.json. The media Worker (worker/index.js) needs the size
 *  to answer Range requests, which Safari/iPhone requires to play video. */
function mediaSizes() {
  return {
    name: 'media-sizes',
    apply: 'build',
    closeBundle() {
      const root = 'dist'
      const sizes = {}
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name)
          const st = statSync(full)
          if (st.isDirectory()) walk(full)
          else if (/\.(mp4|webm|mov|m4v|mp3|m4a|ogg|wav)$/i.test(name)) {
            sizes['/' + relative(root, full).split(sep).join('/')] = st.size
          }
        }
      }
      walk(root)
      writeFileSync('worker/media-sizes.json', JSON.stringify(sizes, null, 2) + '\n')
    },
  }
}

export default defineConfig({
  plugins: [react(), siteMeta(), mediaSizes()],
  server: {
    host: true,
    port: 5173,
    // Ignore Visual Studio's .vs index (locks .vsidx files → EBUSY watcher crash) and VCS dirs.
    // Films too: one still being copied in is locked and crashes the watcher the same way.
    watch: { ignored: ['**/.vs/**', '**/.git/**', '**/.wrangler/**', '**/*.mp4'] },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    // Never inline fonts into the render-blocking CSS as base64 — as files they
    // download only when a page uses that script, and stay cached.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
})
