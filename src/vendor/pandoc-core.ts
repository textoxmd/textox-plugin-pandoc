/*!
 * Vendored from pandoc-wasm 1.1.0 (`src/core.js`), MIT License.
 * Copyright (c) Tweag I/O Limited, Johannes Wilm, and pandoc-wasm contributors.
 * See `./LICENSE-pandoc-wasm`. The WASM binary itself is Pandoc, GPL-2.0-or-later.
 *
 * 只保留 `convert` / `query` 需要的逻辑：浏览器入口（`index.browser.js`）用
 * `import('./pandoc.wasm')` 拿资源 URL，在插件的 blob URL 环境下不可用，因此这里
 * 改成由调用方提供二进制字节。
 */
import {
  ConsoleStdout,
  Directory,
  File,
  OpenFile,
  PreopenDirectory,
  WASI,
} from '@bjorn3/browser_wasi_shim';

export type PandocFileInput = string | Blob;

export interface PandocConvertResult {
  stdout: string;
  stderr: string;
  warnings: unknown[];
  files: Record<string, Blob>;
  mediaFiles: Record<string, Blob>;
}

export interface PandocInstance {
  convert(
    options: Record<string, unknown>,
    stdin: string | null,
    files: Record<string, PandocFileInput>,
  ): Promise<PandocConvertResult>;
}

interface PandocWasmExports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  query(optionsPtr: number, length: number): void;
  convert(optionsPtr: number, length: number): void;
  __wasm_call_ctors(): void;
  hs_init_with_rtsopts(argcPtr: number, argvPtr: number): void;
}

export async function createPandocInstance(
  wasmBinary: ArrayBuffer | Uint8Array,
): Promise<PandocInstance> {
  const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
  const env: string[] = [];
  const fileSystem = new Map<string, File | Directory>();
  const fds = [
    new OpenFile(new File(new Uint8Array(), { readonly: true })),
    ConsoleStdout.lineBuffered((msg) => console.log(`[WASI stdout] ${msg}`)),
    ConsoleStdout.lineBuffered((msg) => console.warn(`[WASI stderr] ${msg}`)),
    new PreopenDirectory('/', fileSystem),
  ];
  const wasi = new WASI(args, env, fds, { debug: false });

  const instantiated = await WebAssembly.instantiate(wasmBinary, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  // 传字节时返回 `{ module, instance }`；个别 TS 重载把它标成 `Instance`，两种都兼容。
  const instance =
    'instance' in instantiated
      ? (instantiated as { instance: WebAssembly.Instance }).instance
      : (instantiated as unknown as WebAssembly.Instance);
  const wasm = instance.exports as unknown as PandocWasmExports;
  wasi.initialize(instance as never);
  wasm.__wasm_call_ctors();

  const memoryDataView = (): DataView => new DataView(wasm.memory.buffer);

  const argcPtr = wasm.malloc(4);
  memoryDataView().setUint32(argcPtr, args.length, true);
  const argv = wasm.malloc(4 * (args.length + 1));
  for (let i = 0; i < args.length; ++i) {
    const arg = wasm.malloc(args[i]!.length + 1);
    new TextEncoder().encodeInto(
      args[i]!,
      new Uint8Array(wasm.memory.buffer, arg, args[i]!.length),
    );
    memoryDataView().setUint8(arg + args[i]!.length, 0);
    memoryDataView().setUint32(argv + 4 * i, arg, true);
  }
  memoryDataView().setUint32(argv + 4 * args.length, 0, true);
  const argvPtr = wasm.malloc(4);
  memoryDataView().setUint32(argvPtr, argv, true);

  wasm.hs_init_with_rtsopts(argcPtr, argvPtr);

  async function addFile(
    filename: string,
    data: PandocFileInput,
    readonly: boolean,
  ): Promise<void> {
    let uint8Array: Uint8Array;
    if (typeof data === 'string') {
      uint8Array = new TextEncoder().encode(data);
    } else {
      uint8Array = new Uint8Array(await data.arrayBuffer());
    }
    fileSystem.set(filename, new File(uint8Array, { readonly }));
  }

  /** 写参数 JSON 到 wasm 内存，返回 (ptr, byteLength)。 */
  function writeOptions(options: Record<string, unknown>): [number, number] {
    const optsStr = JSON.stringify(options);
    const encoded = new TextEncoder().encode(optsStr);
    const ptr = wasm.malloc(encoded.length);
    new TextEncoder().encodeInto(
      optsStr,
      new Uint8Array(wasm.memory.buffer, ptr, encoded.length),
    );
    return [ptr, encoded.length];
  }

  async function convert(
    options: Record<string, unknown>,
    stdin: string | null,
    inputFiles: Record<string, PandocFileInput>,
  ): Promise<PandocConvertResult> {
    const [ptr, length] = writeOptions(options);

    // 克隆一份，避免向调用方的对象里塞输出文件
    const files: Record<string, PandocFileInput> = { ...inputFiles };

    fileSystem.clear();
    const inFile = new File(new Uint8Array(), { readonly: true });
    const outFile = new File(new Uint8Array(), { readonly: false });
    const errFile = new File(new Uint8Array(), { readonly: false });
    const warningsFile = new File(new Uint8Array(), { readonly: false });
    fileSystem.set('stdin', inFile);
    fileSystem.set('stdout', outFile);
    fileSystem.set('stderr', errFile);
    fileSystem.set('warnings', warningsFile);

    const knownFiles = new Set(['stdin', 'stdout', 'stderr', 'warnings']);

    for (const filename of Object.keys(files)) {
      await addFile(filename, files[filename]!, true);
      knownFiles.add(filename);
    }

    const outputFileName =
      typeof options['output-file'] === 'string' ? options['output-file'] : null;
    const extractMediaPath =
      typeof options['extract-media'] === 'string' ? options['extract-media'] : null;

    if (outputFileName) {
      await addFile(outputFileName, new Blob(), false);
      knownFiles.add(outputFileName);
    }
    if (extractMediaPath && extractMediaPath.endsWith('.zip')) {
      await addFile(extractMediaPath, new Blob(), false);
      knownFiles.add(extractMediaPath);
    }

    if (stdin) inFile.data = new TextEncoder().encode(stdin);

    wasm.convert(ptr, length);

    if (outputFileName) {
      const produced = fileSystem.get(outputFileName);
      if (produced instanceof File && produced.data.length > 0) {
        files[outputFileName] = new Blob([produced.data as unknown as BlobPart]);
      }
    }

    if (extractMediaPath) {
      const media = fileSystem.get(extractMediaPath);
      if (media instanceof File && media.data.length > 0) {
        files[extractMediaPath] = new Blob([media.data as unknown as BlobPart], {
          type: 'application/zip',
        });
      }
    }

    const mediaFiles: Record<string, Blob> = {};
    const collectNewFiles = (
      map: ReadonlyMap<string, unknown>,
      prefix: string,
    ): void => {
      for (const [name, entry] of map.entries()) {
        const path = prefix ? `${prefix}/${name}` : name;
        if (entry instanceof Directory) {
          collectNewFiles(entry.contents, path);
        } else if (entry instanceof File && !knownFiles.has(path) && entry.data.length > 0) {
          const blob = new Blob([entry.data as unknown as BlobPart]);
          files[path] = blob;
          mediaFiles[path] = blob;
        }
      }
    };
    collectNewFiles(fileSystem, '');

    const rawWarnings = new TextDecoder('utf-8', { fatal: true }).decode(
      warningsFile.data,
    );
    let warnings: unknown[] = [];
    if (rawWarnings) {
      try {
        warnings = JSON.parse(rawWarnings) as unknown[];
      } catch (error) {
        console.warn('Failed to parse warnings:', error);
      }
    }

    return {
      stdout: new TextDecoder('utf-8', { fatal: true }).decode(outFile.data),
      stderr: new TextDecoder('utf-8', { fatal: true }).decode(errFile.data),
      warnings,
      files: files as Record<string, Blob>,
      mediaFiles,
    };
  }

  return { convert };
}
