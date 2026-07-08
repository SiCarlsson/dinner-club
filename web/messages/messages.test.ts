import { describe, it, expect } from "vitest";
import sv from "./sv.json";
import en from "./en.json";

function getKeys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? getKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function getEntries(obj: object, prefix = ""): [string, unknown][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? getEntries(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  );
}

describe("translation files", () => {
  it("have identical keys across all locales", () => {
    const svKeys = getKeys(sv).sort();
    const enKeys = getKeys(en).sort();
    expect(enKeys).toEqual(svKeys);
  });

  it("have no empty translation values", () => {
    const locales = { sv, en };

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
