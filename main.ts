// Ember & Thyme — Rush Hour Kitchen: hand-in program (Node 22, stdlib only).
//
// Copies the static game (game/) and its screenshots (screenshots/) from
// beside this file into the grader's output directory and writes
// dossier.json there with the vendored make.fun library. The output
// directory comes from MAKEFUN_OUTPUT_DIR, falling back to OUTPUT_PATH,
// then to /output inside the grader container, then to a local output/
// folder when run by hand. Two runs over the same tree write the same
// bytes, so the result is deterministic.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR ?? process.env.OUTPUT_PATH;
  if (fromEnv && fromEnv.trim() !== '') return fromEnv;
  if (process.env.MAKEFUN_BOT_DIR) return '/output';
  return join(repoRoot, 'output');
}

const outDir = resolveOutputDir();

// Start from a clean slate so a stale file from an earlier run can never
// leak into the hand-in. Clear the directory's CONTENTS only: the grader
// mounts /output as a filesystem, and removing the mount point itself
// throws EBUSY (exit 1) — that killed round 1.
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes;
// the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`hand-in written to ${outDir}`);
