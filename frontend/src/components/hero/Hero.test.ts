import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("public home hero media", () => {
  it("uses the local muted looping video without an image layer underneath", () => {
    const source = readFileSync(new URL("./Hero.tsx", import.meta.url), "utf8");
    const videoPath = new URL("../../../public/hero/makeup-products.mp4", import.meta.url);

    assert.equal(source.match(/src="\/hero\/makeup-products\.mp4"/g)?.length, 1);
    assert.equal(source.includes('poster="/hero/makeup-products.jpg"'), false);
    assert.equal(source.includes("autoPlay"), true);
    assert.equal(source.includes("muted"), true);
    assert.equal(source.includes("loop"), true);
    assert.equal(source.includes("playsInline"), true);
    assert.equal(source.includes('<img\n            src="/hero/makeup-products.jpg"'), false);
    assert.equal(existsSync(videoPath), true);
  });

  it("softens the visual transition when the video loop restarts", () => {
    const source = readFileSync(new URL("./Hero.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("LOOP_FADE_WINDOW_SECONDS"), true);
    assert.equal(source.includes("onTimeUpdate"), true);
    assert.equal(source.includes("onSeeked"), true);
    assert.equal(source.includes('transition: "opacity 700ms ease-in-out"'), true);
  });

  it("lets the hero video fill the public home background behind the current gradient", () => {
    const source = readFileSync(new URL("./Hero.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("min-h-[100svh]"), true);
    assert.equal(source.includes("absolute inset-0 hidden lg:block"), true);
    assert.equal(source.includes("object-[center_right]"), true);
    assert.equal(source.includes("w-[64%]"), false);
  });
});
