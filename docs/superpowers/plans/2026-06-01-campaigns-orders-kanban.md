# Campaigns And Orders Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add marketing campaigns with countdowns, external product visibility controls, and an admin orders Kanban with ticket/name/phone search.

**Architecture:** Backend owns campaign validity, campaign price calculation, order ticket generation, and order status transitions. Frontend renders admin workflows through dedicated Marketing and Orders modules, while the product edit modal stays focused on product content. Public catalog products receive active campaign metadata from the bootstrap API.

**Tech Stack:** Express, Supabase, React, TypeScript, Zustand, Vite, node:test.

---

### Task 1: Backend Domain Rules

**Files:**
- Create: `backend/src/modules/orders/status.ts`
- Create: `backend/src/modules/orders/status.test.ts`
- Create: `backend/src/modules/marketing/campaignRules.ts`
- Create: `backend/src/modules/marketing/campaignRules.test.ts`

- [ ] Define the allowed admin order statuses: `new`, `confirmed`, `preparing`, `ready_for_pickup`, `sent`, `completed`, `cancelled`.
- [ ] Normalize legacy labels from the current route to the new status codes.
- [ ] Add search matching by `order_code`, `customer_phone`, and `customer_name`.
- [ ] Add campaign selection logic that returns the active campaign with the highest priority for a product.
- [ ] Add discount calculation for `percent`, `fixed`, and `override_price`.
- [ ] Verify with node:test before wiring routes.

### Task 2: Database Contract

**Files:**
- Modify: `database/schema.sql`
- Create: `database/migrations/20260601010000_marketing_orders_kanban.sql`

- [ ] Create `marketing_campaigns`.
- [ ] Create `marketing_campaign_products`.
- [ ] Create `order_status_events`.
- [ ] Expand the `orders.status` check constraint to include the Kanban statuses.
- [ ] Add indexes for campaign windows, order status, ticket, phone, and customer name.

### Task 3: Backend Routes

**Files:**
- Create: `backend/src/modules/marketing/routes.ts`
- Modify: `backend/src/modules/orders/routes.ts`
- Modify: `backend/src/modules/catalog/service.ts`
- Modify: `backend/src/modules/products/mapper.ts`
- Modify: `backend/src/server.ts`
- Modify: `backend/package.json`

- [ ] Add authenticated campaign CRUD routes.
- [ ] Add campaign product attach/detach routes.
- [ ] Add order search/filter route using ticket, phone, and customer name.
- [ ] Add explicit Kanban status route with event history.
- [ ] Decorate public catalog products with active campaign metadata and final price.
- [ ] Keep order creation applying valid campaign prices server-side.

### Task 4: Frontend Admin Modules

**Files:**
- Create: `frontend/src/services/marketingService.ts`
- Create: `frontend/src/services/adminOrderService.ts`
- Create: `frontend/src/modules/marketing/views/MarketingView.tsx`
- Create: `frontend/src/modules/orders/views/OrdersKanbanView.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/modules/layout/components/AdminSidebar.tsx`

- [ ] Add `Marketing` menu item and route.
- [ ] Add `Pedidos` menu item and route.
- [ ] Build campaign list, creation modal, product selector, status actions, and campaign summary cards.
- [ ] Build Kanban columns, search input, order cards, and order detail modal.

### Task 5: Public Catalog Experience

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/catalogService.ts`
- Modify: `frontend/src/components/catalog/Catalog.tsx`
- Modify: `frontend/src/components/catalog/ProductCard.tsx`
- Modify: `frontend/src/components/catalog/ProductDetail.tsx`
- Modify: `frontend/src/components/cart/CartDrawer.tsx`
- Modify: `frontend/src/components/catalog/catalogSort.ts`

- [ ] Render campaign badge and countdown on product cards.
- [ ] Render campaign price and original price on product details.
- [ ] Carry campaign price into cart display.
- [ ] Show ticket success state after checkout with copyable order code.
- [ ] Keep WhatsApp opening after order creation.

### Task 6: Product Modal Cleanup

**Files:**
- Modify: `frontend/src/modules/products/components/ProductFormModal.tsx`
- Modify: `frontend/src/modules/products/views/ProductsListView.tsx`
- Modify: `frontend/src/modules/products/store/useProductStore.ts`
- Modify: `frontend/src/services/productService.ts`
- Modify: `backend/src/modules/products/routes.ts`

- [ ] Remove the Vitrine section from the edit product modal.
- [ ] Keep existing flags preserved when saving product content.
- [ ] Add explicit visibility endpoints instead of toggle-only behavior.
- [ ] Add list controls for active/published/featured/new outside the modal.

### Task 7: Verification

**Files:**
- No new files.

- [ ] Run `npm test --workspace backend`.
- [ ] Run `npm run lint --workspace backend`.
- [ ] Run `npm run lint --workspace frontend`.
- [ ] Run `npm run build --workspace frontend`.
- [ ] Verify `/admin/orders`, `/admin/marketing`, `/catalogo`, and checkout manually.
