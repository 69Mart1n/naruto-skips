import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync, unzipSync } from 'fflate';
import { build } from './build.mjs';
import { isMain, prepare, projectRoot } from './prepare.mjs';
import { validateExtension } from './validate.mjs';

export const installFolder = 'naruto-skips-main';
const sourceDirs = ['extension', 'data', 'scripts', 'tests', '.github'];
const sourceFiles = ['manifest.json', 'package.json', 'package-lock.json', '.gitignore', '.gitattributes'];

export async function packageProject(root = projectRoot) {
  await build(root);
  const dist = resolve(root, 'dist');
  const stage = await mkdtemp(resolve(dist, '.package-'));
  try {
    const folder = resolve(stage, installFolder);
    await mkdir(folder);
    for (const name of [...sourceDirs, ...sourceFiles, ...(await readdir(root)).filter(name => name.endsWith('.md'))]) {
      await cp(resolve(root, name), resolve(folder, name), { recursive: true });
    }
    await prepare(folder, { check: true });
    await validateExtension(folder);
    const entries = {};
    async function collect(dir, prefix) {
      for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
        const path = resolve(dir, entry.name);
        const name = `${prefix}/${entry.name}`;
        if (entry.isDirectory()) await collect(path, name);
        else if (entry.isFile()) entries[name] = [new Uint8Array(await readFile(path)), { mtime: new Date('2020-01-01T00:00:00Z') }];
        else throw new Error(`Tipo de archivo no admitido: ${name}`);
      }
    }
    await collect(folder, installFolder);
    const archive = zipSync(entries, { level: 6 });
    // Validate the actual archive after extraction, including source freshness.
    const extracted = resolve(stage, 'extracted');
    await mkdir(extracted);
    const unpacked = unzipSync(archive);
    for (const [name, bytes] of Object.entries(unpacked)) {
      if (!name.startsWith(`${installFolder}/`) || name.includes('..') || name.includes('\\')) throw new Error(`Entrada ZIP inválida: ${name}`);
      const file = resolve(extracted, name);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, bytes);
    }
    await prepare(resolve(extracted, installFolder), { check: true });
    const { manifest } = await validateExtension(resolve(extracted, installFolder));
    const filename = `naruto-skips-${manifest.version}-instalable.zip`;
    const path = resolve(dist, filename);
    await writeFile(path, archive);
    const sha256 = createHash('sha256').update(archive).digest('hex');
    await writeFile(`${path}.sha256`, `${sha256}  ${filename}\n`);
    return { path, sha256, files: Object.keys(unpacked).length, bytes: archive.length };
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) console.log(JSON.stringify(await packageProject(), null, 2));
