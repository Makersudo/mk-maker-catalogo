import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("app document branding", () => {
  it("uses the MK Maker logo favicon and subtitle in the browser tab", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    assert.equal(html.includes('<link rel="icon" type="image/png" href="/assets/mk-maker-logo-symbol-transparent.png" />'), true);
    assert.equal(html.includes("<title>MK Maker | Makeup & Beauty</title>"), true);
  });

  it("ships mobile install metadata and dedicated PWA icons", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const manifest = readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8");
    const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

    assert.equal(html.includes('<meta name="mobile-web-app-capable" content="yes" />'), true);
    assert.equal(html.includes('<meta name="apple-mobile-web-app-capable" content="yes" />'), true);
    assert.equal(html.includes('<link rel="apple-touch-icon" sizes="180x180" href="/assets/mk-maker-icon-180.png" />'), true);
    assert.equal(manifest.includes('"src": "/assets/mk-maker-icon-192.png"'), true);
    assert.equal(manifest.includes('"src": "/assets/mk-maker-icon-512.png"'), true);
    assert.equal(manifest.includes('"src": "/assets/mk-maker-maskable-512.png"'), true);
    assert.equal(manifest.includes('"purpose": "maskable"'), true);
    assert.equal(manifest.includes('"shortcuts"'), true);
    assert.equal(sw.includes("/assets/mk-maker-icon-192.png"), true);
    assert.equal(sw.includes("/assets/mk-maker-maskable-512.png"), true);
  });

  it("shows a responsive MK Maker splash before the React catalog loads", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    assert.equal(html.includes('id="app-splash"'), true);
    assert.equal(html.includes('class="app-splash__logo"'), true);
    assert.equal(html.includes('/assets/mk-maker-logo-symbol-transparent.png'), true);
    assert.equal(html.includes('as="video"'), false);
    assert.equal(html.includes('<link rel="preload" href="/hero/makeup-products.mp4"'), false);
    assert.equal(html.includes('@media (max-width: 640px)'), true);
    assert.equal(html.includes('aria-label="Carregando catalogo MK Maker"'), true);
  });
});
