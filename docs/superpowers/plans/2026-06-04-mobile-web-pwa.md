# MK Maker Mobile Web And PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public catalog, checkout, admin panel, and mobile home-screen install experience usable on mobile web.

**Architecture:** Keep the existing Vite/React/Tailwind structure and add responsive variants at the component boundaries already present: public catalog components, admin shell components, admin feature views, and PWA assets. Desktop behavior stays intact while mobile receives alternate cards, sheets, status tabs, and safe-area aware layout.

**Tech Stack:** React, React Router, Tailwind CSS utilities, Vite public assets, Web App Manifest, Service Worker push notifications, Node test runner.

---

### Task 1: PWA Icons And Document Metadata

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/public/manifest.webmanifest`
- Modify: `frontend/public/sw.js`
- Create generated assets: `frontend/public/assets/mk-maker-icon-180.png`, `frontend/public/assets/mk-maker-icon-192.png`, `frontend/public/assets/mk-maker-icon-512.png`, `frontend/public/assets/mk-maker-maskable-512.png`
- Test: `frontend/src/appDocument.test.ts`

- [ ] **Step 1: Write failing document and manifest tests**

Assert that `index.html` references the 180px Apple icon and mobile web app metadata, and that `manifest.webmanifest` references generated 192/512/maskable icon files.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/appDocument.test.ts`
Expected: FAIL because generated icon paths and Apple mobile metadata are not fully present.

- [ ] **Step 3: Generate icons and update metadata**

Create square transparent PNG icons from `mk-maker-logo-symbol-transparent.png`, centered with safe padding. Update manifest and service worker icon paths.

- [ ] **Step 4: Run test to verify pass**

Run: `npx tsx --test src/appDocument.test.ts`
Expected: PASS.

### Task 2: Public Catalog And Checkout Mobile Shell

**Files:**
- Modify: `frontend/src/components/catalog/Catalog.tsx`
- Modify: `frontend/src/components/catalog/ProductCard.tsx`
- Modify: `frontend/src/components/catalog/ProductDetail.tsx`
- Modify: `frontend/src/components/cart/CartDrawer.tsx`
- Test: `frontend/src/components/catalog/ProductCard.test.ts`

- [ ] **Step 1: Write failing mobile contract tests**

Assert that product cards use adaptive image sizing, the cart drawer uses `dvh` and safe-area mobile padding, and product detail has mobile sticky purchase actions.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/components/catalog/ProductCard.test.ts`
Expected: FAIL because cart/product-detail mobile contracts are incomplete.

- [ ] **Step 3: Implement mobile catalog and cart layout**

Keep desktop grid and sidebar, while mobile uses compact pagination, adaptive image boxes, full-screen checkout drawer, and safe bottom padding.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx tsx --test src/components/catalog/ProductCard.test.ts`
Expected: PASS.

### Task 3: Admin Mobile Shell, Products, And Orders

**Files:**
- Modify: `frontend/src/modules/layout/views/AdminLayout.tsx`
- Modify: `frontend/src/modules/layout/components/AdminHeader.tsx`
- Modify: `frontend/src/modules/products/views/ProductsListView.tsx`
- Modify: `frontend/src/modules/orders/views/OrdersKanbanView.tsx`
- Modify: `frontend/src/modules/products/components/ProductFormModal.tsx`
- Test: `frontend/src/modules/adminLayoutDensity.test.ts`

- [ ] **Step 1: Write failing admin mobile tests**

Assert that the admin shell is safe-area aware, products expose a mobile card list while keeping the desktop table, orders expose mobile status tabs, and modals use full-height mobile sheets.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/modules/adminLayoutDensity.test.ts`
Expected: FAIL because the products page and orders view still rely on desktop-first horizontal layouts.

- [ ] **Step 3: Implement admin mobile alternates**

Add mobile cards for products, status tabs for orders, viewport-safe notification dropdowns, and mobile-friendly modal sizing without removing the desktop table/kanban.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx tsx --test src/modules/adminLayoutDensity.test.ts`
Expected: PASS.

### Task 4: Final Verification And Deploy

**Files:**
- No new source files expected beyond Tasks 1-3.

- [ ] **Step 1: Run focused tests**

Run: `npx tsx --test src/appDocument.test.ts src/components/catalog/ProductCard.test.ts src/components/catalog/catalogSort.test.ts src/services/notificationService.test.ts src/modules/layout/components/AdminSidebar.test.ts src/modules/products/components/purchasePricing.test.ts src/modules/adminLayoutDensity.test.ts src/modules/auth/loginLayout.test.ts`
Expected: all tests pass.

- [ ] **Step 2: Run TypeScript and production build**

Run: `npm run lint --workspace frontend`
Expected: exit 0.

Run: `npm run build --workspace frontend`
Expected: exit 0.

- [ ] **Step 3: Verify with mobile screenshots**

Use Playwright at 390x844 for `/inicio`, `/catalogo`, one `/produto/...`, `/login`, `/admin/products`, and `/admin/orders`. Confirm no obvious horizontal page overflow, controls remain visible, and core actions are reachable.

- [ ] **Step 4: Deploy**

Run `vercel build --prod` and `vercel deploy --prebuilt --prod`, then verify the production alias `https://mkmakercatalogo.vercel.app`.
