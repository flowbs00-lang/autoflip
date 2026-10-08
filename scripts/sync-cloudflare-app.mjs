import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'cloudflare/app');
const files = [
  'index.html',
  'style.css',
  'ui.css',
  'plates.css',
  'garage-system.css',
  'world-system.css',
  'world-fixes.css',
  'negotiations-system.css',
  'mobile-first.css',
  'theme-polish.css',
  'account.css',
  'cloud-save.js',
  'game-account.js',
  'world-data.js',
  'script_base.js',
  'car-catalog.js',
  'v79_market.js',
  'script.js',
  'ui.js',
  'plates.js',
  'garage-system.js',
  'world-system.js',
  'negotiations-system.js',
  'photo-credits.html',
  'restoration-photo-credits.html'
];

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const file of files) await cp(resolve(root, file), resolve(target, file));
await cp(resolve(root, 'assets'), resolve(target, 'assets'), { recursive: true });

console.log(`Synced ${files.length} game files and assets to cloudflare/app`);
