import type { PublicCatalogBootstrapResponse, PublicCatalogProduct } from "./services/catalogService";

const SPLASH_ID = "app-splash";
const HERO_VIDEO_URL = "/hero/makeup-products.mp4";
const MINIMUM_SPLASH_TIME_MS = 750;
const MAXIMUM_CRITICAL_ASSET_WAIT_MS = 12_000;
const INITIAL_IMAGE_LIMIT = 8;

let publicCatalogPreparation: Promise<void> | null = null;

type SplashProduct = Pick<PublicCatalogProduct, "images"> & {
  campaign?: unknown;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

export function getCriticalPublicMedia(pathname: string) {
  return pathname === "/inicio" ? [HERO_VIDEO_URL] : [];
}

export function selectInitialCatalogImageUrls(products: SplashProduct[], limit = INITIAL_IMAGE_LIMIT) {
  const campaignProducts = products.filter((product) => Boolean(product.campaign));
  const regularProducts = products.filter((product) => !product.campaign);
  const uniqueUrls = new Set<string>();

  for (const product of [...campaignProducts, ...regularProducts]) {
    const url = product.images?.[0]?.trim();
    if (!url) continue;

    uniqueUrls.add(url);
    if (uniqueUrls.size >= limit) break;
  }

  return Array.from(uniqueUrls);
}

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    const finish = () => resolve();

    image.onload = finish;
    image.onerror = finish;
    image.src = url;

    if (image.complete) finish();
  });
}

function preloadVideo(url: string) {
  return new Promise<void>((resolve) => {
    const existingVideo = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-hero-video]"))
      .find((video) => video.getAttribute("src") === url);
    const video = existingVideo ?? document.createElement("video");
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("canplaythrough", finish);
      video.removeEventListener("error", finish);
      resolve();
    };

    video.addEventListener("canplaythrough", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    if (!existingVideo) {
      video.src = url;
      video.load();
    }

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) finish();
  });
}

export function dismissPublicCatalogSplash() {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return;

  const heroVideo = document.querySelector<HTMLVideoElement>("video[data-hero-video]");
  if (heroVideo) {
    heroVideo.currentTime = 0;
    void heroVideo.play().catch(() => undefined);
  }

  splash.classList.add("app-splash--hidden");
  window.setTimeout(() => splash.remove(), 420);
}

export function preparePublicCatalogSplash(
  loadCatalog: () => Promise<PublicCatalogBootstrapResponse>,
  criticalMediaUrls: string[] = [],
) {
  if (publicCatalogPreparation) return publicCatalogPreparation;

  publicCatalogPreparation = (async () => {
    const startedAt = Date.now();

    try {
      const catalog = await loadCatalog();
      const imageUrls = selectInitialCatalogImageUrls(catalog.products);
      const criticalAssets = [
        ...imageUrls.map(preloadImage),
        ...criticalMediaUrls.map(preloadVideo),
      ];

      await Promise.race([
        Promise.allSettled(criticalAssets),
        wait(MAXIMUM_CRITICAL_ASSET_WAIT_MS),
      ]);
    } catch {
      // The catalog renders its own error state after the splash closes.
    } finally {
      const remainingMinimumTime = Math.max(0, MINIMUM_SPLASH_TIME_MS - (Date.now() - startedAt));
      if (remainingMinimumTime > 0) await wait(remainingMinimumTime);
      dismissPublicCatalogSplash();
    }
  })();

  return publicCatalogPreparation;
}
