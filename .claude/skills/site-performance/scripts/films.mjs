#!/usr/bin/env node
/* Shrink films only as far as they stay visually identical.
     node films.mjs [--envelope] [--crfs 18,20,22] [--out optimized] <film.mp4...>

   Every film is encoded (H.264, x264 preset slower, index up front) at each
   CRF and scored with VMAF against the original; the smallest encode that
   passes the quality gate wins. If it wouldn't save at least 15%, the film is
   only remuxed with its index moved to the front, which is lossless.

   --envelope  the full-screen opening film. Phones show it cover-fit and
               zoomed in, so it is scored as a 390×844@3x phone sees it (the
               centre crop, upscaled) with its own gate, and an untagged HD
               film is tagged BT.709, which is what browsers already assume,
               so every browser draws it the same and the poster matches.

   The gates were calibrated on real invitation films (Oct 2026): they pick
   CRF 20 for typical event films and CRF 14 for a 1080p landscape envelope.
   Originals are never touched; results go to --out with the same file names,
   plus report.json. Copy them over the originals once you're happy. */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, statSync, copyFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir, cpus } from 'node:os';
import { probe, run, fastStart, matrixOf, mb } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
const envelope = args.includes('--envelope') && !!args.splice(args.indexOf('--envelope'), 1);
const crfs = opt('--crfs', envelope ? '12,14,16' : '18,20,22').split(',').map(Number).sort((a, b) => b - a);
const outDir = resolve(opt('--out', 'optimized'));
// Film: full-frame VMAF. Envelope: phone-view VMAF, which reads lower for the same encode.
const GATE = envelope ? { mean: 95.3, p1: 93.5 } : { mean: 96.7, p1: 95.4 };
const MIN_SAVING = 0.15;
if (!args.length) { console.error('usage: node films.mjs [--envelope] [--crfs 18,20,22] [--out dir] <film.mp4...>'); process.exit(1); }

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'films-'));
const threads = cpus().length;
let logN = 0;

/** VMAF of `dist` against `ref`; `crop` = the phone's view of a cover-fit film. */
function vmaf(dist, ref, crop) {
  const pre = crop ? `crop=${crop.w}:${crop.h},scale=1170:2532:flags=bicubic,` : '';
  const log = `vmaf-${logN++}.json`; // relative: Windows drive colons break filter args
  run(['-i', dist, '-i', ref, '-lavfi',
    `[0:v]${pre}setpts=PTS-STARTPTS[d];[1:v]${pre}setpts=PTS-STARTPTS[r];[d][r]libvmaf=log_fmt=json:log_path=${log}:n_threads=${threads}`,
    '-f', 'null', '-'], { cwd: tmp });
  const j = JSON.parse(readFileSync(join(tmp, log), 'utf8'));
  const v = j.frames.map((f) => f.metrics.vmaf).sort((a, b) => a - b);
  return { mean: j.pooled_metrics.vmaf.mean, p1: v[Math.floor(v.length * 0.01)] };
}

/** Centre region a 390×844 portrait phone shows of a cover-fit film (even sizes). */
function phoneCrop({ width: w, height: h }) {
  const even = (n) => 2 * Math.round(n / 2);
  return w / h > 390 / 844 ? { w: even(h * 390 / 844), h } : { w, h: even(w * 844 / 390) };
}

const report = [];
for (const src of args.map((a) => resolve(a))) {
  const name = basename(src), p = probe(src), size = statSync(src).size, out = join(outDir, name);
  const crop = envelope ? phoneCrop(p) : null;
  const audio = !p.audio ? [] : ['aac', 'mp3'].includes(p.audio) ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '192k'];
  console.log(`\n${name}: ${p.codec} ${p.width}x${p.height}, ${(p.kbps / 1000).toFixed(1)} Mbps, ${mb(size)}`
    + `${p.x264 ? `, x264 crf ${p.x264.crf} keyint ${p.x264.keyint}` : ''}${fastStart(src) ? '' : ', index at end'}`);

  const tries = [];
  for (const crf of crfs) {
    const file = join(tmp, `${crf}-${name}`);
    run(['-i', src, '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'slower', '-crf', String(crf),
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...audio, '-movflags', '+faststart', file]);
    const t = { crf, file, size: statSync(file).size, ...vmaf(file, src, crop) };
    t.pass = t.mean >= GATE.mean && t.p1 >= GATE.p1;
    tries.push(t);
    console.log(`  crf ${crf}: ${mb(t.size)}  vmaf ${t.mean.toFixed(2)} (1% low ${t.p1.toFixed(2)})  ${t.pass ? 'pass' : 'below gate'}`);
    if (t.pass) break; // CRFs run from the smallest file up, so the first pass is the best
  }

  const best = tries.filter((t) => t.pass).sort((a, b) => a.size - b.size)[0];
  let action;
  if (best && best.size <= size * (1 - MIN_SAVING)) {
    copyFileSync(best.file, out);
    action = `re-encoded at CRF ${best.crf} (−${Math.round((1 - best.size / size) * 100)}%)`;
  } else if (p.codec !== 'h264') {
    const t = best || tries.sort((a, b) => a.crf - b.crf)[0];
    copyFileSync(t.file, out);
    action = `re-encoded at CRF ${t.crf} — required: not H.264${best ? '' : ' (no CRF passed the gate; this is the finest tried)'}`;
  } else {
    run(['-i', src, '-map', '0', '-c', 'copy', '-movflags', '+faststart', out]);
    action = 'kept the picture as is; index moved up front (lossless)';
  }
  if (envelope && !/bt709|bt470bg|smpte170m|bt2020/.test(p.colour) && matrixOf(p) === 'bt709') {
    const tagged = join(tmp, `tag-${name}`);
    run(['-i', out, '-map', '0', '-c', 'copy', '-bsf:v',
      'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
      '-movflags', '+faststart', tagged]);
    copyFileSync(tagged, out);
    action += '; tagged BT.709';
  }
  const final = statSync(out).size;
  console.log(`  → ${action}: ${mb(size)} → ${mb(final)}`);
  report.push({ film: name, before: size, after: final, action, gate: GATE, phoneView: envelope,
    tries: tries.map(({ crf, size: s, mean, p1, pass }) => ({ crf, size: s, mean: +mean.toFixed(2), p1: +p1.toFixed(2), pass })) });
}

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
rmSync(tmp, { recursive: true, force: true });
const sum = (k) => report.reduce((n, r) => n + r[k], 0);
console.log(`\nTotal ${mb(sum('before'))} → ${mb(sum('after'))}. Results in ${outDir}`
  + (envelope ? '\nNow re-export the poster: node poster.mjs <new envelope film>' : ''));
