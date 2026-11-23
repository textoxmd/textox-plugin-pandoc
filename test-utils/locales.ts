import { describe, expect, it } from 'vitest';

/**
 * 各包 `src/locales.test.ts` 共用的契约断言。
 *
 * 宿主（Textox）支持 15 种语言，插件缺失的语言会回退 `defaultLocale`。为了让插件在
 * 任何界面语言下都有本地化文案，这里把「15 种语言齐全 + key 集合与 en-US 一致 +
 * 顶层 name / description 非空 + 无空串」固化成测试，避免以后加语言时漏键。
 *
 * 放在仓根而不是各包内：只被测试 import，不参与插件构建（构建入口是
 * `plugin.config.ts`）。各包仍可用 `bun test src/locales.test.ts` 独立跑。
 */

/** 与宿主 `APP_LANGUAGES` 保持一致（宿主：`src/i18n/plugin-messages.ts`）。 */
export const APP_LANGUAGES = [
  'ar-SA',
  'de-DE',
  'en-US',
  'es-ES',
  'fr-FR',
  'hi-IN',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'pt-PT',
  'ru-RU',
  'th-TH',
  'vi-VN',
  'zh-CN',
  'zh-TW',
] as const;

type LocaleMessages = Record<string, unknown>;

/** 扁平化 key 路径（嵌套对象用 `.` 连接），用于跨语言比较 key 集合。 */
export function flattenLocaleKeys(messages: LocaleMessages, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenLocaleKeys(value as LocaleMessages, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

/** 扁平化后的叶子值，用于检查空串。 */
function flattenLocaleValues(messages: LocaleMessages): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(messages)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of flattenLocaleValues(value as LocaleMessages)) {
        entries.push([`${key}.${nestedKey}`, nestedValue]);
      }
    } else {
      entries.push([key, value]);
    }
  }
  return entries;
}

export interface LocaleContractOptions {
  /** 插件 id，仅用于测试输出。 */
  id: string;
  defaultLocale: string;
  locales: Record<string, LocaleMessages>;
  /** 必须是字符串的顶层 key（缺省为 name / description）。 */
  requiredStringKeys?: readonly string[];
}

/**
 * 注册一组语言契约断言。各包测试只调用一次。
 */
export function defineLocaleContract(options: LocaleContractOptions): void {
  const { id, defaultLocale, locales } = options;
  const requiredStringKeys = options.requiredStringKeys ?? ['name', 'description'];
  const baseMessages = locales['en-US'];

  describe(`${id} locales`, () => {
    it('覆盖宿主的 15 种语言', () => {
      expect(Object.keys(locales).sort()).toEqual([...APP_LANGUAGES].sort());
    });

    it('defaultLocale 为 en-US 且存在', () => {
      expect(defaultLocale).toBe('en-US');
      expect(Object.keys(locales)).toContain(defaultLocale);
      expect(baseMessages).toBeDefined();
    });

    it('每种语言的 key 集合与 en-US 完全一致', () => {
      const baseKeys = flattenLocaleKeys(baseMessages!);
      for (const language of APP_LANGUAGES) {
        expect(flattenLocaleKeys(locales[language]!), language).toEqual(baseKeys);
      }
    });

    it('顶层 name / description 在每种语言下都是非空字符串', () => {
      for (const language of APP_LANGUAGES) {
        for (const key of requiredStringKeys) {
          const value = locales[language]![key];
          expect(typeof value, `${language}.${key}`).toBe('string');
          expect(String(value).trim().length, `${language}.${key}`).toBeGreaterThan(0);
        }
      }
    });

    it('不存在空字符串值', () => {
      for (const language of APP_LANGUAGES) {
        for (const [key, value] of flattenLocaleValues(locales[language]!)) {
          expect(typeof value, `${language}.${key}`).toBe('string');
          expect(String(value).trim().length, `${language}.${key}`).toBeGreaterThan(0);
        }
      }
    });

    it('顶层 key 不带点（嵌套用对象表达，宿主按 i18next 的点路径读取）', () => {
      for (const language of APP_LANGUAGES) {
        for (const key of Object.keys(locales[language]!)) {
          expect(key, `${language}.${key}`).not.toContain('.');
        }
      }
    });
  });
}
