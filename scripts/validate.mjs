import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { Script, runInNewContext } from 'node:vm';
import { isMain, prepare, projectRoot } from './prepare.mjs';

export async function validateExtension(root) {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  if (manifest.manifest_version !== 3 || !manifest.name || !/^\d+\.\d+\.\d+(\.\d+)?$/.test(manifest.version)) {
    throw new Error('Manifiesto Manifest V3 inválido.');
  }
  const checked = new Set();
  async function resource(path, base = root) {
    if (!path || /^[a-z]+:|^\/|\\/i.test(path)) throw new Error(`Ruta local inválida: ${path}`);
    const file = resolve(base, path.split(/[?#]/)[0]);
    if (!file.startsWith(resolve(root) + sep)) throw new Error(`Ruta fuera del paquete: ${path}`);
    if (!(await stat(file)).isFile()) throw new Error(`No es un archivo: ${path}`);
    checked.add(relative(root, file));
    return file;
  }
  const paths = [manifest.background?.service_worker, manifest.action?.default_popup,
    ...Object.values(manifest.icons ?? {}), ...Object.values(manifest.action?.default_icon ?? {}),
    ...(manifest.content_scripts ?? []).flatMap(content => [...(content.js ?? []), ...(content.css ?? [])])];
  for (const path of paths) await resource(path);
  const popup = resolve(root, manifest.action.default_popup);
  const html = await readFile(popup, 'utf8');
  for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)) {
    await resource(match[1], dirname(popup));
  }
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (/\.(js|css)$/.test(entry.name)) {
        const source = await readFile(file, 'utf8');
        if (entry.name.endsWith('.js')) new Script(source, { filename: file });
        // Theme images are assigned by JavaScript; CSS may also reference local assets.
        for (const match of source.matchAll(/["'](assets\/[^"']+)["']/g)) await resource(match[1], dirname(file));
        if (entry.name.endsWith('.css')) {
          for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
            if (!/^(data:|https?:)/.test(match[1])) await resource(match[1], dirname(file));
          }
        }
      }
    }
  }
  await visit(dirname(popup));
  for (const [name, global] of [['episodes', 'NarutoData'], ['netflix-catalog', 'NarutoNetflixCatalog']]) {
    const context = {};
    runInNewContext(await readFile(resolve(dirname(popup), `data/${name}.js`), 'utf8'), context);
    if (!context[global]?.series) throw new Error(`Datos incompletos: ${name}`);
    const original = resolve(root, `data/${name}.json`);
    try {
      if (JSON.stringify(context[global]) !== JSON.stringify(JSON.parse(await readFile(original, 'utf8')))) {
        throw new Error(`Datos desactualizados: ${name}`);
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { manifest, resources: checked.size };
}

if (isMain(import.meta.url)) {
  const root = process.argv[2] ? resolve(process.argv[2]) : projectRoot;
  if (root === projectRoot) await prepare(root, { check: true });
  const result = await validateExtension(root);
  console.log(`Rutas, datos y sintaxis JavaScript verificados (${result.resources} recursos, versión ${result.manifest.version}).`);
}
