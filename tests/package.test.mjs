import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { JSDOM, VirtualConsole } from 'jsdom';
import { prepare, projectRoot } from '../scripts/prepare.mjs';
import { validateExtension } from '../scripts/validate.mjs';
import { build } from '../scripts/build.mjs';
import { installFolder, packageProject } from '../scripts/package.mjs';

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'naruto-skips-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of ['extension', 'data', 'scripts', 'tests', '.github', 'package.json', 'package-lock.json', '.gitignore', '.gitattributes', 'INSTALAR.md']) {
    await cp(resolve(projectRoot, name), resolve(root, name), { recursive: true });
  }
  await prepare(root);
  return root;
}

test('downloaded source loads from its root and preserves all manifest behavior', async () => {
  await prepare(projectRoot, { check: true });
  const { manifest } = await validateExtension(projectRoot);
  const source = JSON.parse(await readFile(resolve(projectRoot, 'extension/manifest.json'), 'utf8'));
  // Every value is identical after removing only the new root-relative prefix.
  const unprefixed = JSON.parse(JSON.stringify(manifest).replaceAll('extension/', ''));
  assert.deepEqual(unprefixed, source);
  for (const [name, global] of [['episodes', 'NarutoData'], ['netflix-catalog', 'NarutoNetflixCatalog']]) {
    const context = {};
    runInNewContext(await readFile(resolve(projectRoot, `extension/data/${name}.js`), 'utf8'), context);
    assert.deepEqual(JSON.parse(JSON.stringify(context[global])), JSON.parse(await readFile(resolve(projectRoot, `data/${name}.json`), 'utf8')));
  }
});

test('preparation repairs missing files and rejects stale data and manifests in check mode', async t => {
  const root = await fixture(t);
  await rm(resolve(root, 'manifest.json'));
  await rm(resolve(root, 'extension/data/episodes.js'));
  await rm(resolve(root, 'extension/data/netflix-catalog.js'));
  await assert.rejects(prepare(root, { check: true }), /manifest.json falta/);
  await prepare(root);
  await validateExtension(root);
  const data = JSON.parse(await readFile(resolve(root, 'data/episodes.json'), 'utf8'));
  data.packageRegression = true;
  await writeFile(resolve(root, 'data/episodes.json'), JSON.stringify(data));
  await assert.rejects(prepare(root, { check: true }), /episodes.js falta o está desactualizado/);
  await prepare(root);
  const source = JSON.parse(await readFile(resolve(root, 'extension/manifest.json'), 'utf8'));
  source.description += ' regression';
  await writeFile(resolve(root, 'extension/manifest.json'), JSON.stringify(source));
  await assert.rejects(prepare(root, { check: true }), /manifest.json falta o está desactualizado/);
  await prepare(root);
  await prepare(root, { check: true });
});

test('validation detects missing scripts, icons, theme assets, and JavaScript syntax errors', async t => {
  const root = await fixture(t);
  for (const name of ['data/episodes.js', 'data/netflix-catalog.js', 'assets/icon-128.png', 'assets/stickers/asta.png']) {
    const path = resolve(root, 'extension', name);
    const original = await readFile(path);
    await rm(path);
    await assert.rejects(validateExtension(root), { code: 'ENOENT' });
    await writeFile(path, original);
  }
  await writeFile(resolve(root, 'extension/core.js'), 'function invalid( {');
  await assert.rejects(validateExtension(root), SyntaxError);
});

test('rebuild removes obsolete output and leaves the legacy install complete', async t => {
  const root = await fixture(t);
  await mkdir(resolve(root, 'dist/extension'), { recursive: true });
  await writeFile(resolve(root, 'dist/extension/obsolete.js'), 'old');
  await build(root);
  await assert.rejects(stat(resolve(root, 'dist/extension/obsolete.js')), { code: 'ENOENT' });
  await validateExtension(resolve(root, 'dist/extension'));
  await prepare(root, { check: true });
});

test('installable ZIP extracts to one complete root and the actual popup loads its local scripts', async t => {
  const root = await fixture(t);
  const result = await packageProject(root);
  const archive = await readFile(result.path);
  assert.equal(createHash('sha256').update(archive).digest('hex'), result.sha256);
  const entries = unzipSync(archive);
  assert.ok(entries[`${installFolder}/manifest.json`]);
  assert.ok(entries[`${installFolder}/extension/data/episodes.js`]);
  assert.ok(entries[`${installFolder}/extension/data/netflix-catalog.js`]);
  assert.ok(entries[`${installFolder}/data/episodes.json`]);
  assert.ok(entries[`${installFolder}/scripts/prepare.mjs`]);
  assert.ok(entries[`${installFolder}/.github/workflows/package.yml`]);
  for (const name of Object.keys(entries)) {
    assert.equal(name.split('/')[0], installFolder);
    assert.doesNotMatch(name, /\\|\/node_modules\/|\/dist\/|\/\.git\/|\/artifacts\//);
  }
  const extracted = resolve(root, 'extracted');
  for (const [name, bytes] of Object.entries(entries)) {
    const path = resolve(extracted, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  const installed = resolve(extracted, installFolder);
  await prepare(installed, { check: true });
  const { manifest } = await validateExtension(installed);
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = await JSDOM.fromFile(resolve(installed, manifest.action.default_popup), {
    runScripts: 'dangerously', resources: 'usable', virtualConsole,
    beforeParse(window) {
      window.chrome = {
        storage: { local: { get: async defaults => defaults, set: async () => {} } },
        tabs: { query: async () => [], sendMessage: async () => ({ available: false }) }
      };
    }
  });
  try {
    await new Promise((resolveLoad, reject) => {
      const timeout = setTimeout(() => reject(new Error('El panel no terminó de cargar')), 10000);
      dom.window.addEventListener('load', () => { clearTimeout(timeout); resolveLoad(); }, { once: true });
    });
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.deepEqual(errors, []);
    assert.ok(dom.window.NarutoData.series.naruto);
    assert.equal(dom.window.document.querySelectorAll('.anime-card').length, 7);
  } finally { dom.window.close(); }
});
