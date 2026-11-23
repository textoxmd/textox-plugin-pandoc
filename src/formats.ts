export type PandocFormat = 'docx' | 'odt' | 'rtf' | 'latex';

export interface PandocSettings {
  toc: boolean;
  numberSections: boolean;
}

/** Markdown 方言：GFM 与编辑器预览一致；公式用 `$…$`，脚注与 GFM 表格保留。 */
export const PANDOC_FROM = 'gfm+tex_math_dollars+footnotes';

const OUTPUT_NAMES: Record<PandocFormat, string> = {
  docx: 'out.docx',
  odt: 'out.odt',
  rtf: 'out.rtf',
  latex: 'out.tex',
};

const EXTENSIONS: Record<PandocFormat, string> = {
  docx: 'docx',
  odt: 'odt',
  rtf: 'rtf',
  latex: 'tex',
};

/** `output-file` 必填：否则 Pandoc 把二进制写到 stdout，包装层会按 UTF-8 解码并抛错。 */
export function outputFileName(format: PandocFormat): string {
  return OUTPUT_NAMES[format];
}

export function extensionFor(format: PandocFormat): string {
  return EXTENSIONS[format];
}

export function buildPandocOptions(
  format: PandocFormat,
  settings: PandocSettings,
): Record<string, unknown> {
  return {
    from: PANDOC_FROM,
    to: format,
    standalone: true,
    'output-file': outputFileName(format),
    ...(settings.toc ? { 'table-of-contents': true } : {}),
    ...(settings.numberSections ? { 'number-sections': true } : {}),
  };
}

/** 沿用当前文档名，只换扩展名；无路径时退化为 `Untitled`。 */
export function suggestedName(sourcePath: string | null, format: PandocFormat): string {
  const base = sourcePath?.split(/[\\/]/).pop() ?? '';
  const stem = base.replace(/\.[^.]+$/, '') || 'Untitled';
  return `${stem}.${extensionFor(format)}`;
}
