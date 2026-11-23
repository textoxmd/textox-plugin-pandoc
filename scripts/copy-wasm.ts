/**
 * 构建后置步骤：把 pandoc 的 WASM 二进制复制进 `dist/`。
 *
 * 56MB 的二进制不进 git（见仓库根 `.gitignore`），但打包时必须存在——所以每次构建都
 * 从 `node_modules/pandoc-wasm` 取一份。`plugin-build` 会清空 `dist/`，本步骤必须在
 * 它之后执行。
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const entry = require.resolve('pandoc-wasm');
const root = resolve(dirname(entry), '..');

const candidates = [join(dirname(entry), 'pandoc.wasm'), join(root, 'src', 'pandoc.wasm')];
const source = candidates.find((path) => existsSync(path));
if (!source) {
  throw new Error(`pandoc.wasm not found (looked in: ${candidates.join(', ')})`);
}

const dist = join(process.cwd(), 'dist');
mkdirSync(dist, { recursive: true });
const target = join(dist, 'pandoc.wasm');
copyFileSync(source, target);

const megabytes = (statSync(target).size / 1024 / 1024).toFixed(1);
if (Number(megabytes) < 40) {
  throw new Error(`pandoc.wasm looks truncated: ${megabytes}MB`);
}
console.log(`📦 pandoc.wasm: ${megabytes}MB -> dist/pandoc.wasm`);
