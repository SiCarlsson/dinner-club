import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "./manifest";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const EXPECTED_PUBLIC_FILES = [
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512-maskable.png",
  "icon-512.png",
  "screenshot-narrow.png",
  "screenshot-wide.png",
];

const referencedAssets = (() => {
  const m = manifest();
  return [
    ...(m.icons ?? []).map((icon) => icon.src),
    ...(m.screenshots ?? []).map((screenshot) => screenshot.src),
  ];
})();

describe("web app manifest", () => {
  it("references at least one icon and one screenshot", () => {
    const m = manifest();
    expect(m.icons?.length ?? 0).toBeGreaterThan(0);
    expect(m.screenshots?.length ?? 0).toBeGreaterThan(0);
  });

  it("public/ contains exactly the expected files", () => {
    const actual = readdirSync(publicDir).sort();
    expect(actual).toEqual([...EXPECTED_PUBLIC_FILES].sort());
  });

  it.each(referencedAssets)("has the referenced asset on disk: %s", (src) => {
    const filePath = join(publicDir, src.replace(/^\//, ""));
    expect(
      existsSync(filePath),
      `${src} is referenced by the manifest but missing from public/`,
    ).toBe(true);
  });
});
