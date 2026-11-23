/**
 * Pandoc 实例：懒加载 + 单例。
 *
 * wasm 约 56MB，走 asset 协议直接 `fetch`（`plugin_asset_path` 负责解析路径并放行
 * scope），比 base64 过 IPC 少一份峰值内存。宿主导出有单飞锁，因此不需要考虑
 * `convert` 的并发调用。
 */
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

import { PLUGIN_ID } from './plugin-id';
import { createPandocInstance, type PandocInstance } from './vendor/pandoc-core';

let pending: Promise<PandocInstance> | null = null;

async function loadWasm(): Promise<ArrayBuffer> {
  const path = await invoke<string>('plugin_asset_path', {
    pluginId: PLUGIN_ID,
    path: 'pandoc.wasm',
  });
  const response = await fetch(convertFileSrc(path));
  if (!response.ok) {
    throw new Error(`pandoc.wasm: HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}

export function getPandoc(): Promise<PandocInstance> {
  if (!pending) {
    pending = loadWasm()
      .then((binary) => createPandocInstance(binary))
      .catch((error) => {
        // 失败不缓存，下次导出可以重试（例如用户刚恢复被删的插件文件）。
        pending = null;
        throw error;
      });
  }
  return pending;
}

/** 仅供测试：丢掉单例。 */
export function resetPandocForTests(): void {
  pending = null;
}
