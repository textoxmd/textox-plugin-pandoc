/**
 * 打包：`texto-plugin pack` 会先重建一次 dist（清空目录），把构建后置步骤产出的
 * `locales.json` / `pandoc.wasm` 冲掉；这里直接复用 `packPluginFiles` 读现成 dist。
 *
 * 用法：`bun run build && bun scripts/pack.ts`
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { packPluginFiles, packPluginPath } from '@textox/plugin-build';

import config from '../plugin.config';

function readDistFiles(dir: string, prefix = ''): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(fullPath).isDirectory()) {
      Object.assign(files, readDistFiles(fullPath, relPath));
      continue;
    }
    if (relPath.endsWith('.zip')) continue;
    files[relPath] = new Uint8Array(readFileSync(fullPath));
  }
  return files;
}

const pluginDir = process.cwd();
const outDir = join(pluginDir, 'dist');
const files = readDistFiles(outDir);
if (!('pandoc.wasm' in files)) {
  throw new Error('dist/pandoc.wasm is missing — run `bun run build` first');
}

const archive = packPluginFiles(config, files);
const target = packPluginPath(pluginDir, config);
writeFileSync(target, archive);
console.log(`packed ${config.id} -> ${target} (${(archive.byteLength / 1024 / 1024).toFixed(1)}MB)`);
