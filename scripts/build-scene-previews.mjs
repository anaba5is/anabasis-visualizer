import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenes } from '../scenes.mjs';

const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'anabasis-scenes-'));
const output = join(assets, 'previews');
mkdirSync(output, { recursive: true });
try {
  for (const { file } of Object.values(scenes)) {
    const png = join(scratch, 'scene.png');
    execFileSync('dwebp', ['-quiet', join(assets, file), '-o', png]);
    for (const [prefix, width, quality] of [['thumb', '160', '76'], ['card', '560', '82']]) {
      execFileSync('cwebp', ['-quiet', '-q', quality, '-resize', width, '0', png, '-o', join(output, prefix + '-' + file)]);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
