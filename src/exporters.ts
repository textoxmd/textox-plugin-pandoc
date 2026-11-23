import { invoke } from '@tauri-apps/api/core';
import type {
  ExportOutput,
  ExportRequestContext,
  PluginApp,
  PluginExporter,
} from '@textox/plugin-sdk';

import {
  buildPandocOptions,
  extensionFor,
  outputFileName,
  suggestedName,
  type PandocFormat,
  type PandocSettings,
} from './formats';
import { inlineLocalImages } from './images';
import { getPandoc } from './pandoc';

interface FormatSpec {
  format: PandocFormat;
  id: string;
  labelKey: string;
  menuAction: string;
  order: number;
}

/**
 * 四种输出。`menuAction` 必须与宿主原生「导出」子菜单项的 id 一致，否则点击分派
 * 不到这里；`order` 排在 HTML（10）/ EPUB（20）之后。
 */
export const FORMAT_SPECS: readonly FormatSpec[] = [
  { format: 'docx', id: 'docx', labelKey: 'docxLabel', menuAction: 'export_docx', order: 30 },
  { format: 'odt', id: 'odt', labelKey: 'odtLabel', menuAction: 'export_odt', order: 40 },
  { format: 'rtf', id: 'rtf', labelKey: 'rtfLabel', menuAction: 'export_rtf', order: 50 },
  { format: 'latex', id: 'latex', labelKey: 'texLabel', menuAction: 'export_tex', order: 60 },
];

function readSettings(app: PluginApp): PandocSettings {
  return {
    toc: app.settings.get<boolean>('toc') ?? false,
    numberSections: app.settings.get<boolean>('numberSections') ?? false,
  };
}

/**
 * 读源文件 → 抽取本地图片 → 交给 Pandoc。宿主导出前已强制保存，所以磁盘内容就是
 * 用户看到的内容；未保存文档（无路径）在宿主层已被拦下，这里再做一次防御。
 */
export async function convertDocument(
  ctx: ExportRequestContext,
  format: PandocFormat,
  settings: PandocSettings,
): Promise<ExportOutput> {
  if (!ctx.currentFile) throw new Error('pandoc: no document to export');

  const source = await invoke<string>('read_file', { path: ctx.currentFile });
  const { markdown, files } = await inlineLocalImages(source, ctx.documentDir);

  const pandoc = await getPandoc();
  const output = outputFileName(format);
  const result = await pandoc.convert(buildPandocOptions(format, settings), markdown, files);

  const produced = result.files[output];
  if (!produced) {
    throw new Error(result.stderr.trim() || `pandoc produced no ${format} output`);
  }

  const bytes = new Uint8Array(await produced.arrayBuffer());
  return {
    // LaTeX 是文本，其余是二进制（宿主按 base64 落盘）。
    data: format === 'latex' ? new TextDecoder().decode(bytes) : bytes,
    suggestedName: suggestedName(ctx.currentFile, format),
  };
}

export function createExporters(app: PluginApp): PluginExporter[] {
  return FORMAT_SPECS.map((spec) => ({
    id: spec.id,
    labelKey: spec.labelKey,
    extension: extensionFor(spec.format),
    kind: spec.format === 'latex' ? 'text' : 'binary',
    menuAction: spec.menuAction,
    order: spec.order,
    run: (ctx) => convertDocument(ctx, spec.format, readSettings(app)),
  }));
}
