/**
 * 把 Markdown 里的本地图片读成 Blob，并把 `src` 改写成扁平文件名。
 *
 * Pandoc 跑在 WASI 虚拟文件系统里，不接受任意绝对路径；把图片作为输入文件交给它，
 * 引用写成同名相对路径最稳（docx/odt 会据此嵌入媒体）。同时扁平化也避开了虚拟 FS
 * 的嵌套目录。
 */
import { invoke } from '@tauri-apps/api/core';

export interface CollectedImages {
  markdown: string;
  files: Record<string, Blob>;
}

export type ImageReader = (path: string) => Promise<string>;

const IMAGE_PATTERN =
  /!\[([^\]\n]*)\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+(["'])([^"']*)\3)?\s*\)/g;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
};

/** 带 scheme（http:、data:、asset:…）或协议相对的地址交给 Pandoc，原样保留。 */
function isExternalSource(src: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src);
}

function unwrapSource(value: string): string {
  return value.startsWith('<') && value.endsWith('>') ? value.slice(1, -1) : value;
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 词法归一化（折叠 `.` / `..`），不解析符号链接。 */
export function normalizePath(value: string): string {
  const absolute = /^[\\/]/.test(value) || /^[a-zA-Z]:[\\/]/.test(value);
  const parts: string[] = [];
  for (const segment of value.split(/[\\/]+/)) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}`;
}

export function resolveImagePath(src: string, documentDir: string | null): string | null {
  if (!documentDir) return null;
  const decoded = decodePath(unwrapSource(src));
  if (/^[\\/]/.test(decoded) || /^[a-zA-Z]:[\\/]/.test(decoded)) {
    return normalizePath(decoded);
  }
  return normalizePath(`${documentDir}/${decoded}`);
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  if (match[2]) {
    const binary = atob(match[3] ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { mime, bytes };
  }
  return { mime, bytes: new TextEncoder().encode(decodeURIComponent(match[3] ?? '')) };
}

function extensionFor(mime: string, src: string): string {
  const known = MIME_EXTENSIONS[mime.toLowerCase()];
  if (known) return known;
  const fromName = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(unwrapSource(src));
  return fromName?.[1]?.toLowerCase() ?? 'png';
}

const defaultReader: ImageReader = (path) => invoke<string>('read_image_as_data_url', { path });

/**
 * 逐行处理，跳过围栏代码块：代码块里的 `![](…)` 是示例文本，不能改写。
 * 图片语法不跨行，因此按行处理是安全的。
 */
function mapOutsideFences(markdown: string, transform: (line: string) => string): string {
  let fence: string | null = null;
  return markdown
    .split('\n')
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (marker) {
        if (!fence) fence = marker[0] ?? '`';
        else if ((marker[0] ?? '`') === fence) fence = null;
        return line;
      }
      return fence ? line : transform(line);
    })
    .join('\n');
}

/** 行内代码里的 `![](…)` 是示例文本，同样不能改写。 */
function mapOutsideCodeSpans(line: string, transform: (text: string) => string): string {
  let result = '';
  let last = 0;
  for (const match of line.matchAll(/(`+)[\s\S]*?\1/g)) {
    const index = match.index ?? 0;
    result += transform(line.slice(last, index)) + match[0];
    last = index + match[0].length;
  }
  return result + transform(line.slice(last));
}

/** 收集（去重后的）本地图片原始引用，跳过远程/内联地址。 */
function collectSources(markdown: string, documentDir: string | null): string[] {
  const seen = new Set<string>();
  mapOutsideFences(markdown, (line) =>
    mapOutsideCodeSpans(line, (text) => {
      for (const match of text.matchAll(IMAGE_PATTERN)) {
        const raw = match[2];
        if (!raw) continue;
        if (isExternalSource(unwrapSource(raw))) continue;
        const path = resolveImagePath(raw, documentDir);
        if (path) seen.add(path);
      }
      return text;
    }),
  );
  return [...seen];
}

export async function inlineLocalImages(
  markdown: string,
  documentDir: string | null,
  read: ImageReader = defaultReader,
): Promise<CollectedImages> {
  const files: Record<string, Blob> = {};
  const names = new Map<string, string>();

  const sources = collectSources(markdown, documentDir);
  for (const [index, path] of sources.entries()) {
    try {
      const dataUrl = await read(path);
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) continue;
      const name = `textox-image-${index + 1}.${extensionFor(parsed.mime, path)}`;
      names.set(path, name);
      files[name] = new Blob([parsed.bytes as unknown as BlobPart], { type: parsed.mime });
    } catch (error) {
      // 单张图读失败时保留原始引用，不让整篇导出失败。
      console.warn(`[pandoc] failed to read image ${path}:`, error);
    }
  }

  if (names.size === 0) return { markdown, files };

  const rewritten = mapOutsideFences(markdown, (line) =>
    mapOutsideCodeSpans(line, (text) =>
      text.replace(
        IMAGE_PATTERN,
        (whole, alt: string, rawSrc: string, quote?: string, title?: string) => {
          if (isExternalSource(unwrapSource(rawSrc))) return whole;
          const path = resolveImagePath(rawSrc, documentDir);
          const name = path ? names.get(path) : undefined;
          if (!name) return whole;
          const target = quote ? `${name} ${quote}${title ?? ''}${quote}` : name;
          return `![${alt}](${target})`;
        },
      ),
    ),
  );

  return { markdown: rewritten, files };
}
