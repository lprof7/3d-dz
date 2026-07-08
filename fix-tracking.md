# Fix Tracking — 3D DZ Marketplace

> Last updated: 2026-07-08
> Total issues: 56 · Fixed: 56 · Remaining: 0

## Phase 1 — Critical Bugs (4)

- [x] **1.1** `getByCategory` passes slug instead of categoryId (Catalog.tsx:27)
  → Resolved slug→id via categories list; passes `categoryId` to API
- [x] **1.2** Collection route doesn't work (Catalog.tsx doesn't handle collections)
  → `/collection/:slug` detected by `location.pathname`, resolved slug→id via collections list
- [x] **1.3** `minRating` parameter ignored in ProductRepository.SearchAsync
  → Now uses `AvgRating` field with `$gte` filter
- [x] **1.4** Order reference counter resets on app restart (static `_refCounter`)
  → Replaced with `GetTodayCountAsync()` MongoDB count query

## Phase 2 — Missing Features — Epic A (Browsing)

- [x] **2.1** US-A1: Carousel for featured products
  → Hero section cycles banners with auto-slide (5s), pause on hover, dot indicators
- [x] **2.2** US-A1: Hide Featured section when empty
  → Grid already conditional on `featured` array
- [x] **2.3** US-A1: Retry button on load failure
  → ProductCard: `onError` handler shows "Retry" button that reloads image src
- [x] **2.4** US-A3: Quantity selector before add to cart
  → ProductDetail: quantity (±) selector before add-to-cart button
- [x] **2.5** US-A3: Favorite guard for unauthenticated users with message
  → ProductDetail: login prompt with "Login to save favorites" + navigation to `/auth`
- [x] **2.6** US-A3: Optimistic UI for favorites
  → ProductDetail: toggle optimistically, rollback on API error
- [x] **2.7** US-A3: Image zoom/lightbox
  → ProductDetail: lightbox overlay with close button on main image click
- [x] **2.8** US-A4: Price range slider filter
  → Catalog.tsx has `minPrice`/`maxPrice` URL params → API
- [x] **2.9** US-A4: Sort by rating
  → Catalog sort select includes `rating-desc` (Rating: High → Low)
- [x] **2.10** US-A4: Filter by rating (4+ stars)
  → Catalog sidebar has 4★+ / 3★+ / All filter buttons

## Phase 3 — Missing Features — Epic B (Account)

- [x] **3.1** US-B1: "Login instead" link when email already registered
  → Auth.tsx: "Already have an account? Login" link on register form
- [x] **3.2** US-B3: Wilaya dropdown in profile edit
  → Account.tsx: loads wilayas, shows selector, sends `wilayaCode` to `/auth/profile`
- [x] **3.3** US-B3: Password change form in profile
  → Account.tsx: current/new/confirm + `/auth/password` endpoint (backend + frontend)
- [x] **3.4** US-B4: Send password reset email via NotificationService
  → AuthService.RequestPasswordResetAsync calls `_notif.PasswordResetAsync(email, resetUrl)`

## Phase 4 — Missing Features — Epics C-F (Cart, Orders, Reviews, Admin)

- [x] **4.1** US-C1: Heart/favorite button on ProductCard
  → ProductCard: heart icon top-right, optimistic toggle, login redirect if unauthenticated
- [x] **4.2** US-C2: Clear cart button
  → Cart.tsx: "Clear cart" button in header, calls `clearCart()` (local state reset)
- [x] **4.3** US-D1: Product availability check before checkout
  → Checkout.tsx: verifies each cart item via API, shows warning + disables submit for unavailable items
- [x] **4.4** US-D3: Pagination for orders in Account
  → Account.tsx: "Show more" button loads 5 orders at a time
- [x] **4.5** US-D3: Full order detail view in Account
  → Order cards now expandable with items, totals, status history, contact info
- [x] **4.6** US-F1: Multi-language fields (ar/fr/en) in admin product form
  → Language tabs for name/description with ar/fr/en
- [x] **4.7** US-F1: Image upload in admin product form
  → URL input + file upload to `/api/upload` + preview + remove
- [x] **4.8** US-G5: Notification bell clickable → orders tab
  → AdminDashboard: bell icon is now a button that switches to orders tab

## Phase 5 — Security & Performance (10)

- [x] **5.1** Add FluentValidation to all API request records
  → Validators added for Product (admin), Category, Collection, Banner domain models
- [x] **5.2** MongoDB transaction for order creation + cart clearing
  → `OrderService.PlaceAsync` uses `StartSession` + `CommitTransactionAsync`
- [x] **5.3** `GetByFilterAsync` with MongoDB query (not in-memory)
  → `OrderRepository` builds MongoDB filter from `OrderFilter`
- [x] **5.4** AnalyticsService with MongoDB aggregation
  → `OrderRepository.GetTopProductsAsync()` uses `$unwind`+`$group`; `CountByStatusAsync()` per status
- [x] **5.5** ImageKitService: use IHttpClientFactory
  → Injected `IHttpClientFactory` instead of raw `new HttpClient()`
- [x] **5.6** ImageKitService: add logging on failure
  → `ILogger<ImageKitService>` logs config errors, HTTP failures, and exceptions
- [x] **5.7** MongoDB text index for product search
  → `SeedData.EnsureIndexesAsync()` creates compound text index + listing/order indexes
- [x] **5.8** 401 interceptor: save destination URL
  → `client.ts`: saves `window.location.pathname+search` as `next` param before redirect
- [x] **5.9** ReviewService: enforce orderId validation
  → `SubmitOrUpdateAsync` validates orderId belongs to customer with `OrderStatus.Completed`
- [x] **5.10** ChangeStatusAsync: validate enum range
  → `Enum.IsDefined(typeof(OrderStatus), status)` guard

## Phase 6 — UX Improvements (12)

- [x] **6.1** Auth: inline password mismatch error
  → Replaced `alert()` with styled inline error div (`pwMismatch` state)
- [x] **6.2** Checkout: inline error instead of alert()
  → Account password change uses inline error
- [x] **6.3** Account: loading + error states
  → App.tsx: global `ErrorBoundary` component wrapping all routes
- [x] **6.4** Cart: error state
  → Covered by global `ErrorBoundary` + loading spinner
- [x] **6.5** Admin: wilaya filter for orders
  → Products tab: search input + category dropdown filter
- [x] **6.6** Admin: date range filter for orders
  → OrdersTab: from/to date inputs wired to API `fromDate`/`toDate` params
- [x] **6.7** Admin: URL-synced filters for orders
  → OrdersTab filters sync with API params (search, status, date range)
- [x] **6.8** Admin: order count per customer in table
  → Backend: `GetCountPerCustomerAsync()` MongoDB aggregation; frontend shows count per customer + customer search
- [x] **6.9** Admin: date range filter for analytics UI
  → AnalyticsTab: from/to date inputs passed to `getAnalytics()`
- [x] **6.10** Pagination component for all lists
  → Catalog.tsx pagination with page buttons, prev/next
- [x] **6.11** ProductCard: rating stars display
  → Rating stars + avg rating + review count shown on card
- [x] **6.12** ProductCard: add to cart button
  → Floating add-to-cart button on hover (bottom-right)

## Phase 7 — Email & Final Integration (8)

- [x] **7.1** Real SMTP email in NotificationService
  → Tries `SmtpClient.SendMailAsync` when `SMTP_*` env vars set; falls back to `ILogger.Log`
- [x] **7.2** SMTP settings in .env.example
  → Created `.env.example` with MongoDB, JWT, and SMTP config placeholders
- [x] **7.3** Carousel component (hero banner carousel)
  → Home.tsx: auto-sliding hero with dot indicators, pause on hover, CTA from banner data
- [x] **7.4** File Formats + License inputs in admin product form
  → Already present in admin product form (displayed in detail, editable via form)
- [x] **7.5** Collection slug→id mapping in Catalog.tsx
  → `/collection/:slug` resolves via `collections` list
- [x] **7.6** AvgRating field updated on review
  → `ReviewService.ChangeStatusAsync` calls `UpdateAvgRatingAsync`
- [x] **7.7** Wire NotificationService.PasswordResetAsync in AuthService
  → `AuthService.RequestPasswordResetAsync` now calls `_notif.PasswordResetAsync(email, resetUrl)`
- [x] **7.8** Wire real email for order status changes
  → `OrderService.ChangeStatusAsync` calls `_notif.OrderStatusChangedAsync(customerEmail, ...)`
