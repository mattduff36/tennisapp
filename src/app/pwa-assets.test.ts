import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("PWA install assets", () => {
  it("PWA-01: favicon and touch icons exist on disk", () => {
    const files = [
      "public/favicon.svg",
      "public/favicon.ico",
      "public/apple-touch-icon.png",
      "public/icon-192.png",
      "public/icon-512.png",
      "public/icon-maskable-512.png",
      "src/app/favicon.ico",
      "src/app/apple-icon.png",
    ];
    for (const file of files) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true);
    }
  });

  it("PWA-02: manifest keeps the PWA inside the app scope", () => {
    const nextManifest = manifest();
    expect(nextManifest.start_url).toBe("/play");
    expect(nextManifest.scope).toBe("/");
    expect(nextManifest.display).toBe("standalone");
    expect(nextManifest.icons?.map((icon) => icon.src)).toEqual(
      expect.arrayContaining([
        "/icon-192.png",
        "/icon-512.png",
        "/icon-maskable-512.png",
      ]),
    );
  });

  it("PWA-03: status-bar inset sits on the shell, not the site nav", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toMatch(
      /\.pegboard-shell\s*\{[\s\S]*?padding:\s*env\(safe-area-inset-top/,
    );
    expect(css).toMatch(
      /\.play-shell\s*\{[\s\S]*?padding-top:\s*env\(safe-area-inset-top/,
    );
    const nav = css.match(/\.play-top-nav\s*\{([^}]+)\}/);
    expect(nav).not.toBeNull();
    expect(nav![1]).not.toMatch(/safe-area-inset-top/);
  });
});
