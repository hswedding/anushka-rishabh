#!/usr/bin/env node
/* Read-only audit of a site's media for load-time problems.
     node audit.mjs [projectDir]        (default: current directory)
   Scans public/ and src/ (skipping node_modules, dist, .git) and flags films
   that aren't H.264, keep their index at the end, run a heavy bitrate or were
   encoded with a tiny keyframe interval; plus oversized images, favicon and
   files over Cloudflare's 25 MiB limit. Changes nothing. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import sharp from 'sharp';
import { probe, fastStart, mb, kb } from './lib.mjs';

const root = process.argv[2] || process.cwd();
const SKIP = new Set(['node_modules', 'dist', '.git', '.vs', '.wrangler', '.claude']);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  SKIP.has(e.name) ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const files = ['public', 'src'].flatMap((d) => { try { return walk(join(root, d)); } catch { return []; } });

const rows = [], issues = [];
// Files under src/ ship only when code imports them; public/ always ships.
const flag = (f, msg) => issues.push(`  ${relative(root, f)} — ${msg}${/[\\/]src[\\/]/.test(f) ? ' (only if imported)' : ''}`);

for (const f of files) {
  const ext = extname(f).toLowerCase(), size = statSync(f).size;
  if (size > 25 * 1048576) flag(f, `${mb(size)}: over Cloudflare's 25 MiB per-file limit`);

  if (ext === '.mp4' || ext === '.mov' || ext === '.webm') {
    const p = probe(f), fast = ext === '.mp4' && fastStart(f);
    rows.push([relative(root, f), mb(size), `${p.codec} ${p.width}x${p.height}`, `${(p.kbps / 1000).toFixed(1)} Mbps`,
      fast ? 'index first' : 'INDEX AT END', p.x264 ? `x264 crf ${p.x264.crf ?? '?'} keyint ${p.x264.keyint ?? '?'}` : 'not x264']);
    if (p.codec !== 'h264') flag(f, `${p.codec}: Safari plays only H.264 MP4 — re-encode (films.mjs)`);
    if (!fast) flag(f, 'index (moov) at the end — the browser must fetch the file end before playing; films.mjs fixes it losslessly');
    if (p.kbps > 4000) flag(f, `${(p.kbps / 1000).toFixed(1)} Mbps is heavy for a phone — try films.mjs`);
    if (p.x264?.keyint && p.x264.keyint < 60) flag(f, `keyframe every ${p.x264.keyint} frames inflates the file — re-encode`);
    // The envelope film is meant to sit at CRF ~14 (phones zoom it); films.mjs --envelope judges it.
    if (p.x264?.crf != null && p.x264.crf < (/envelop/i.test(f) ? 14 : 20)) flag(f, `encoded at CRF ${p.x264.crf} — likely room to shrink`);
  } else if (ext === '.mp3' || ext === '.m4a' || ext === '.wav') {
    rows.push([relative(root, f), mb(size), 'audio', '', '', '']);
    if (ext === '.wav') flag(f, 'uncompressed audio — export as MP3/AAC from the original source');
  } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    const m = await sharp(f).metadata();
    rows.push([relative(root, f), kb(size), `${m.format} ${m.width}x${m.height}`, m.hasAlpha ? 'alpha' : '', '', '']);
    if (/favicon|apple-touch/i.test(f) && (m.width > 512 || size > 60 * 1024)) flag(f, `${m.width}px / ${kb(size)} — every guest downloads it; images.mjs favicon makes a 180px one`);
    else if (ext === '.png' && size > 50 * 1024) flag(f, `${kb(size)} PNG — near-lossless WebP is usually ~50% smaller (images.mjs webp)`);
    else if (ext === '.gif' && size > 200 * 1024) flag(f, `${kb(size)} GIF — use a muted looping MP4 instead`);
    if (m.width > 2400) flag(f, `${m.width}px wide — more than 3× any phone display; check its CSS width before shipping`);
  }
}

const w = rows.reduce((a, r) => r.map((c, i) => Math.max(a[i] || 0, String(c).length)), []);
console.log(rows.map((r) => r.map((c, i) => String(c).padEnd(w[i])).join('  ')).join('\n'));
console.log(issues.length ? `\nTo fix (${issues.length}):\n${issues.join('\n')}` : '\nNo media issues found.');
