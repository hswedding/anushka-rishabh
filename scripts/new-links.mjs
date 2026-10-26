#!/usr/bin/env node
/* Writes fresh random ids into `config.links` in src/data.js — the secret
   paths of the builder and the ready-made side links — and prints them.
   Run once for every new couple (new-couple.sh does it), and again only to
   revoke every link already sent.

     node scripts/new-links.mjs */
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/data.js', import.meta.url);
const ids = {};
const src = readFileSync(file, 'utf8').replace(/links: \{[^}]*\}/, (block) =>
  block.replace(/(\w+): '[^']*'/g, (_, key) => {
    ids[key] = randomBytes(9).toString('base64url');
    return `${key}: '${ids[key]}'`;
  })
);
if (!Object.keys(ids).length) {
  console.error('No `links: { … }` block found in src/data.js');
  process.exit(1);
}
writeFileSync(file, src);
for (const [key, id] of Object.entries(ids)) console.log(`${key.padEnd(8)} /${id}`);
