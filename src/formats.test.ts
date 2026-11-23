import { describe, expect, it } from 'vitest';

import {
  PANDOC_FROM,
  buildPandocOptions,
  extensionFor,
  outputFileName,
  suggestedName,
} from './formats';

describe('buildPandocOptions', () => {
  it('always sets from/to/standalone and an output-file', () => {
    const options = buildPandocOptions('docx', { toc: false, numberSections: false });
    expect(options).toEqual({
      from: PANDOC_FROM,
      to: 'docx',
      standalone: true,
      'output-file': 'out.docx',
    });
  });

  it('adds toc and section numbering only when enabled', () => {
    const options = buildPandocOptions('latex', { toc: true, numberSections: true });
    expect(options['table-of-contents']).toBe(true);
    expect(options['number-sections']).toBe(true);
    expect(options['output-file']).toBe('out.tex');
  });
});

describe('file names', () => {
  it('maps formats to output-file names and extensions', () => {
    expect(outputFileName('odt')).toBe('out.odt');
    expect(outputFileName('rtf')).toBe('out.rtf');
    expect(extensionFor('latex')).toBe('tex');
  });

  it('keeps the source stem but swaps the extension', () => {
    expect(suggestedName('/docs/周报.md', 'docx')).toBe('周报.docx');
    expect(suggestedName('C:\\docs\\notes.markdown', 'latex')).toBe('notes.tex');
  });

  it('falls back to Untitled when there is no path', () => {
    expect(suggestedName(null, 'odt')).toBe('Untitled.odt');
  });
});
