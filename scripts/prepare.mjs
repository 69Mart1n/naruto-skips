import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const isMain = url => Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(url);

export function rootManifest(source) {
  const manifest = structuredClone(source);
  const prefix = path => `extension/${path}`;
  const icons = values => Object.fromEntries(Object.entries(values).map(([size, path]) => [size, prefix(path)]));
  manifest.icons = icons(manifest.icons);
  manifest.background.service_worker = prefix(manifest.background.service_worker);
  manifest.action.default_popup = prefix(manifest.action.default_popup);
  manifest.action.default_icon = icons(manifest.action.default_icon);
  for (const content of manifest.content_scripts) {
    for (const key of ['js', 'css']) if (content[key]) content[key] = content[key].map(prefix);
  }
  return manifest;
}

export async function generatedFiles(root = projectRoot) {
  const manifest = JSON.parse(await readFile(resolve(root, 'extension/manifest.json'), 'utf8'));
  const files = new Map([['manifest.json', `${JSON.stringify(rootManifest(manifest), null, 2)}\n`]]);
  for (const [name, global] of [['episodes', 'NarutoData'], ['netflix-catalog', 'NarutoNetflixCatalog']]) {
    const data = JSON.parse(await readFile(resolve(root, `data/${name}.json`), 'utf8'));
    files.set(`extension/data/${name}.js`, `// Generado desde data/${name}.json. Ejecutar npm run prepare; no editar.\nglobalThis.${global} = ${JSON.stringify(data, null, 2)};\n`);
  }
  return files;
}

export async function prepare(root = projectRoot, { check = false } = {}) {
  // Parse every source before writing anything, so invalid JSON cannot produce a partial update.
  const files = await generatedFiles(root);
  for (const [name, expected] of files) {
    const path = resolve(root, name);
    if (check) {
      const actual = await readFile(path, 'utf8').catch(error => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (actual?.replace(/\r\n/g, '\n') !== expected) {
        throw new Error(`${name} falta o está desactualizado. Ejecutar npm run prepare y guardar los archivos generados en Git.`);
      }
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, expected);
    }
  }
}

if (isMain(import.meta.url)) {
  const check = process.argv.includes('--check');
  await prepare(projectRoot, { check });
  console.log(check ? 'Manifiesto y datos generados actualizados.' : 'Raíz lista para Cargar descomprimida: manifiesto y datos generados.');
}
