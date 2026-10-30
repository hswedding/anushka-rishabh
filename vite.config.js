import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { site, config } from './src/data.js'

// Single-page wedding invitation. No router, no SSR — mirrors the Invifest reference.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Writes the page title, description, link-preview tags and robots into
 *  index.html from `site` in src/data.js, plus the envelope poster preload
 *  from `config.envelopePoster`, so a new couple only edits data.js.
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
      const poster = config.envelopePoster
        ? `<link rel="preload" as="image" type="image/webp" href="${esc(config.envelopePoster)}" />`
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
    watch: { ignored: ['**/.vs/**', '**/.git/**', '**/.wrangler/**'] },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    // Never inline fonts into the render-blocking CSS as base64 — as files they
    // download only when a page uses that script, and stay cached.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
})
