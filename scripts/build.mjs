import { cp, mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prepare, projectRoot, isMain } from './prepare.mjs';
import { validateExtension } from './validate.mjs';

// Replace the previous build only after the new one passes validation.
export async function build(root = projectRoot) {
  await prepare(root);
  await validateExtension(root);
  const dist = resolve(root, 'dist');
  await mkdir(dist, { recursive: true });
  const stage = await mkdtemp(resolve(dist, '.extension-'));
  try {
    await cp(resolve(root, 'extension'), stage, { recursive: true });
    for (const entry of await readdir(root)) {
      if (entry.endsWith('.md')) await cp(resolve(root, entry), resolve(stage, entry));
    }
    for (const name of ['artwork.json', 'stickers.json']) {
      await cp(resolve(root, 'data', name), resolve(stage, 'data', name));
    }
    await validateExtension(stage);
    await rm(resolve(dist, 'extension'), { recursive: true, force: true });
    await rename(stage, resolve(dist, 'extension'));
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
  return resolve(dist, 'extension');
}

if (isMain(import.meta.url)) console.log(`Paquete compatible preparado en ${await build()}`);
