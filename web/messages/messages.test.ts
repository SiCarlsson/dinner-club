// messages/messages.test.ts

import { describe, it, expect } from "vitest";
import en from "./en.json";
import sv from "./sv.json";

const locales = { en, sv } as const;
const referenceLocale = "en";

function getEntries(obj: object, prefix = ""): [string, unknown][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? getEntries(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  );
}

function getKeys(obj: object, prefix = ""): string[] {
  return getEntries(obj, prefix).map(([key]) => key);
}

describe("translation files", () => {
  const referenceKeys = getKeys(locales[referenceLocale]).sort();

  Object.entries(locales)
    .filter(([locale]) => locale !== referenceLocale)
    .forEach(([locale, messages]) => {
      it(`${locale}.json has identical keys to ${referenceLocale}.json`, () => {
        expect(getKeys(messages).sort()).toEqual(referenceKeys);
      });
    });

  it("have no empty translation values", () => {
    for (const [locale, messages] of Object.entries(locales)) {
      const emptyKeys = getEntries(messages)
        .filter(([, value]) => typeof value === "string" && value.trim() === "")
        .map(([key]) => key);

      expect(emptyKeys, `Empty values found in ${locale}.json: ${emptyKeys.join(", ")}`).toEqual(
        [],
      );
    }
  });
});
