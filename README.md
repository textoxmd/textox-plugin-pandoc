# Pandoc Export — Textox 插件

用 [Pandoc](https://pandoc.org)（WASM 版）把当前文档导出为 **Word / OpenDocument / RTF / LaTeX**。

## 功能

| 导出目标 | 扩展名 | 说明 |
|---|---|---|
| Word | `.docx` | 保留标题、列表、表格、图片；公式转为 Word 原生 OMML |
| OpenDocument | `.odt` | LibreOffice / WPS 可直接打开 |
| RTF | `.rtf` | 兼容性最好的富文本 |
| LaTeX | `.tex` | 纯文本源文件，便于接入论文模板 |

- 输入按 GitHub 风格 Markdown 解析（`gfm` + 数学公式 + 脚注）。
- 文档里的**本地图片**会随文档一起嵌入（相对路径按文档所在目录解析）。
- 设置里可开启「生成目录」与「章节编号」。

不支持 PDF：Pandoc 生成 PDF 需要外部 LaTeX / Typst / wkhtmltopdf 引擎，WASM 版无法调用。

## 安装

构建产物是 `dist/app.textox.pandoc-<version>.zip`，在 Textox 里「设置 → 插件 → 导入」，
或用命令行：

```sh
plugin-cli --data-dir "<Textox 数据目录>" install dist/app.textox.pandoc-1.0.0.zip
plugin-cli --data-dir "<Textox 数据目录>" enable app.textox.pandoc
```

安装后需重启应用；导出项出现在「文件 → 导出」。

## 开发

```sh
bun install
bun run typecheck
bun test
bun run build     # 产出 dist/（含 56MB pandoc.wasm）
bun run pack      # 产出 dist/app.textox.pandoc-<version>.zip
```

- 插件契约来自 npm 上的 `@textox/plugin-sdk@^0.4.0` 与 `@textox/plugin-build@^0.1.5`，克隆后直接 `bun install` 即可。
- 图标：`assets/icon.svg` 会被构建工具自动识别并写入清单；内容取自 pandoc 官网
  favicon（作者 Albert Krewinkel，CC BY-SA 4.0），已在文件内保留许可元数据。
- `dist/pandoc.wasm` 由 `scripts/copy-wasm.ts` 从 `node_modules/pandoc-wasm` 复制，不入库。

## 体积与许可

- 插件解压后约 **56MB**（主要是 `pandoc.wasm`），zip 约 **16MB**。
- `pandoc-wasm` 的 JS 包装层为 MIT；其内置的 Pandoc 二进制为 **GPL-2.0-or-later**。
  分发本插件即分发 Pandoc，需遵守 GPL 条款。许可原文见 `src/vendor/LICENSE-pandoc-wasm`
  与 `src/vendor/LICENSE-browser-wasi-shim-MIT`。
