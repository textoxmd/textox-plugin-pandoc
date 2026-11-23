import { Plugin } from '@textox/plugin-sdk';

import { createExporters } from './exporters';
import { defaultLocale, locales } from './locales';

/**
 * Pandoc 导出：把当前文档转成 Word / OpenDocument / RTF / LaTeX。
 *
 * 转换在插件内用 pandoc 的 WASM 完成（`dist/pandoc.wasm`），不依赖用户安装原生
 * Pandoc——macOS 沙盒里外部二进制跑不起来。
 */
export default class PandocExportPlugin extends Plugin {
  onload(): void {
    this.addMessages(locales, defaultLocale);
    for (const exporter of createExporters(this.app)) {
      this.disposables.add(this.app.exporters.register(exporter));
    }
  }
}
