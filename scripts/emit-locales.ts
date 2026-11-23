/**
 * 构建后置步骤：把插件自带的文案导出成 `dist/locales.json`。
 *
 * 宿主在扫描后即注入这份资源，因此**默认停用、从未加载**的插件也能在设置页显示
 * 本地化名称与服务描述。插件 `onload` 里的 `addMessages` 仍是主路径，两者内容一致。
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { defaultLocale, locales } from '../src/locales';

const out = join(process.cwd(), 'dist', 'locales.json');
writeFileSync(out, `${JSON.stringify({ defaultLocale, locales }, null, 2)}\n`, 'utf8');
console.log(`📝 locales: ${Object.keys(locales).length} 种语言 -> dist/locales.json`);
