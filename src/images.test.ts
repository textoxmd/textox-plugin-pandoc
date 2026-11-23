import { describe, expect, it, vi } from 'vitest';

import { inlineLocalImages, normalizePath, resolveImagePath } from './images';

const PNG = 'data:image/png;base64,AAAA';
const JPG = 'data:image/jpeg;base64,/9j/AA==';

function reader(map: Record<string, string>) {
  return vi.fn(async (path: string) => {
    const value = map[path];
    if (!value) throw new Error(`missing ${path}`);
    return value;
  });
}

describe('normalizePath / resolveImagePath', () => {
  it('folds . and .. lexically', () => {
    expect(normalizePath('/docs/./notes/../img/a.png')).toBe('/docs/img/a.png');
  });

  it('resolves relative paths against the document directory and keeps absolute ones', () => {
    expect(resolveImagePath('img/a.png', '/docs')).toBe('/docs/img/a.png');
    expect(resolveImagePath('<img/b c.png>', '/docs')).toBe('/docs/img/b c.png');
    expect(resolveImagePath('/var/a.png', '/docs')).toBe('/var/a.png');
    expect(resolveImagePath('img/a.png', null)).toBeNull();
  });
});

describe('inlineLocalImages', () => {
  it('reads local images, rewrites them to flat names and dedupes', async () => {
    const read = reader({ '/docs/img/a.png': PNG, '/docs/img/b.jpg': JPG });
    const { markdown, files } = await inlineLocalImages(
      '![one](img/a.png)\n![two](img/b.jpg "title")\n![again](img/a.png)',
      '/docs',
      read,
    );

    expect(markdown).toBe(
      '![one](textox-image-1.png)\n![two](textox-image-2.jpg "title")\n![again](textox-image-1.png)',
    );
    expect(Object.keys(files).sort()).toEqual(['textox-image-1.png', 'textox-image-2.jpg']);
    expect(files['textox-image-1.png']?.type).toBe('image/png');
    expect(files['textox-image-2.jpg']?.type).toBe('image/jpeg');
    // 重复引用只读一次
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('leaves remote and data URLs alone', async () => {
    const read = reader({});
    const source = '![r](https://example.com/a.png)\n![d](data:image/png;base64,AAAA)';
    const { markdown, files } = await inlineLocalImages(source, '/docs', read);

    expect(markdown).toBe(source);
    expect(files).toEqual({});
    expect(read).not.toHaveBeenCalled();
  });

  it('does not touch fenced code blocks or inline code', async () => {
    const read = reader({ '/docs/img/a.png': PNG });
    const source = [
      '```md',
      '![sample](img/a.png)',
      '```',
      '`![inline](img/a.png)`',
      '![real](img/a.png)',
    ].join('\n');

    const { markdown } = await inlineLocalImages(source, '/docs', read);

    expect(markdown).toBe(
      [
        '```md',
        '![sample](img/a.png)',
        '```',
        '`![inline](img/a.png)`',
        '![real](textox-image-1.png)',
      ].join('\n'),
    );
  });

  it('keeps the original reference when an image cannot be read', async () => {
    const read = reader({});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { markdown, files } = await inlineLocalImages('![x](img/gone.png)', '/docs', read);

    expect(markdown).toBe('![x](img/gone.png)');
    expect(files).toEqual({});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('leaves everything untouched when there is no document directory', async () => {
    const read = reader({});
    const source = '![x](img/a.png)';
    const { markdown } = await inlineLocalImages(source, null, read);
    expect(markdown).toBe(source);
  });
});
