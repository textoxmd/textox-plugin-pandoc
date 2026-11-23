import { describe, expect, it } from 'vitest';

import { defineLocaleContract } from '../../../test-utils/locales';
import { defaultLocale, locales } from './locales';

defineLocaleContract({
  id: 'app.textox.pandoc',
  defaultLocale,
  locales,
});

describe('pandoc 文案细节', () => {
  it('四种格式的标签在各语言下都是格式名 + 扩展名（专有名词不翻译）', () => {
    const expected = {
      docxLabel: 'Word (.docx)',
      odtLabel: 'OpenDocument (.odt)',
      rtfLabel: 'RTF (.rtf)',
      texLabel: 'LaTeX (.tex)',
    };
    for (const [language, messages] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(expected)) {
        expect(messages[key], `${language}.${key}`).toBe(value);
      }
    }
  });
});
