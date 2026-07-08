# Project Build Instructions — "3D DZ" (read this file fully before writing any code)

You are an autonomous coding agent tasked with building a complete full-stack web application called **"3D DZ"**. Read this entire document before taking any action. This document is your single source of truth for scope, architecture, and process. Follow it precisely. Where anything is ambiguous or you must make an assumption that materially affects architecture, data model, UX, or security, **STOP and ask the user clarifying questions before proceeding** — do not silently guess on important decisions. Minor implementation details (naming, exact spacing, etc.) you may decide yourself using best practices.

---

## 1. Product Overview

"3D DZ" is a single-owner digital marketplace for 3D-printable files (STL/3MF/OBJ etc.), similar in spirit to Cults3D but **NOT a multi-vendor marketplace**. There is exactly one owner/admin who controls all content through a private dashboard. There is **no online payment gateway**. Customers can only submit a manual **Order** containing: Full Name, Phone Number, Email, and Wilaya (Algerian administrative province). The order lands in the admin dashboard, where the admin manually reviews it, contacts the customer, arranges payment/delivery outside the platform, and updates the order status.

The full requirements engineering (stakeholders + user stories) has already been produced and is attached as context below in Section 2 — treat it as authoritative for feature scope. Do not add speculative features beyond it (e.g., do NOT build a payment gateway, do NOT build a multi-vendor system).

## 2. Requirements Context (Stakeholders & User Stories)

<!-- PASTE the full content of requirements.md here before giving this file to the agent, OR keep requirements.md alongside this file in the same folder and reference it. If both files are in the same directory, tell the agent explicitly: -->

> The file `requirements.md` (in this same directory) contains the full stakeholder list and all user stories (Epics A–I). Read it now and treat it as the authoritative feature scope for this build.
>
> The file `flows.md` (in this same directory) contains a detailed step-by-step flow for EVERY user story (preconditions, main flow, alternate/error flows, postcondition). Read it now as well — it is authoritative for exact business logic, validation rules, and edge-case handling. In particular, implement these decisions exactly as specified there (do not deviate):
> - Orders: the cart must NOT be cleared if order submission fails; only clear it after a successful order creation.
> - Reviews: a customer can only submit a review for a product from an order that has status `Completed`. Allow editing an existing review instead of creating duplicates.
> - Product deletion is a **soft delete** (`isDeleted: true` flag), never a hard delete, so historical orders referencing that product remain intact (displayed as "[deleted product]" where needed).
> - A category cannot be deleted while it still has products assigned to it — block the action and show a message telling the admin to reassign/delete those products first.
> - Order internal notes are an append-only, timestamped log (array of `{ text, createdAt, adminId }`), not a single overwritable text field.
> - Banning a customer (`isBanned: true`) blocks login with a clear "account suspended, contact support" message; unbanning restores normal access.
> - Discounts/offers have a start/end date; price automatically reverts to base price after expiry without manual intervention.
> - Password reset uses a time-limited token (e.g., 30 minutes) and always returns the same generic response regardless of whether the email exists, to avoid leaking which emails are registered.

---

## 3. Tech Stack (fixed — do not substitute)

### Backend
- **ASP.NET Core, .NET 10**
- **Architecture:** Service-Oriented Architecture with a clear layered separation:
  - `API` layer (Controllers — thin, no business logic)
  - `Services` layer (business logic, one service interface + implementation per domain area)
  - `Repositories` layer (Repository Pattern — one repository interface + implementation per entity/collection, abstracting all MongoDB access)
  - `Domain/Models` layer (entities, DTOs, enums)
- **Database:** MongoDB Atlas (cloud). Connection string must be read from environment variables / `.env` — never hardcoded. Provide a `.env.example` with placeholder keys.
- **File storage:** ImageKit for all uploaded files/images. API keys and URL endpoint must be read from `.env`. Provide `.env.example` placeholders (`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`).
- **Auth:** Simple JWT-based authentication (no refresh tokens needed). Two roles: `Admin` and `Customer`. Admin is a single seeded account (not self-registerable).
- **Currency:** Prices stored as decimal, default currency DZD (Algerian Dinar), but store currency as a configurable field/setting (not hardcoded string in UI) so it can be changed later.

### Frontend
- **React** (with Vite). Folder structure — **follow exactly**:
  ```
  src/
    presentation/
      features/        # one folder per feature (home, catalog, product-details, cart,
                        #   checkout/order, auth, customer-account, admin-*, etc.)
        <feature-name>/
          components/
          pages/
      shared/           # shared UI components, layout, design tokens usage, hooks used across features
    data/
      <entity-name>/    # one folder per entity (e.g. products, orders, categories, customers, auth)
        <entity>.repository.ts   # Repository Pattern: abstracts API calls for that entity
        <entity>.types.ts
    core/
      config/           # env variable access, constants
      theme/            # SINGLE FILE brand/theme config (see Section 5)
      i18n/             # translation setup
      auth/             # auth context/store, JWT handling
      api/              # base HTTP client (axios/fetch wrapper), interceptors
  ```
- **State management:** choose the best fit for this project's size (e.g. Zustand or Redux Toolkit) — justify your choice briefly in the final report.
- **Styling:** choose the best fit to faithfully reproduce the Stitch design (Tailwind CSS is strongly preferred since it maps well to design-tool output) — justify your choice in the final report.
- **Internationalization:** All user-facing text in the app must be translatable across **3 languages: Arabic (ar), French (fr), English (en)**, using `react-i18next` (or equivalent best-practice library). Also see Section 6 for auto-translation of dynamic content.
- **Default layout direction:** LTR by default; implement RTL switching (dir="rtl", mirrored layout) when Arabic is selected — this can be handled after the base implementation works, but the architecture (CSS, component structure) must not block adding RTL support later.

---

## 4. Design Source (Google Stitch)

The visual design has already been generated using Google Stitch: dark, modern, energetic visual identity with 3D elements, filament-orange primary accent + cyan secondary accent, covering all customer-facing and admin screens. The exported screens (images/HTML, whichever format Stitch provided) will be placed in a `design/` folder in this repository — check that folder first.

**Your job regarding design:**
1. Deeply analyze every exported Stitch screen (colors, spacing, typography scale, corner radii, shadows, component states) before writing any frontend code.
2. Reproduce the design **as faithfully as possible** — do not "reinterpret" it loosely. Pixel-level fidelity is the goal, adapted only where necessary for responsiveness.
3. Extract the entire visual identity into **one single configuration file** (see Section 5) so that colors/fonts/spacing can be changed globally from one place without touching component code.

If any screen needed for a feature in `requirements.md` / `flows.md` is missing from the `design/` folder, flag it clearly and ask the user rather than inventing a design from scratch.

## 5. Single-File Brand Identity Config

Create exactly one file, e.g. `src/core/theme/theme.config.ts`, exporting all brand tokens: color palette (background, surface, primary, secondary, text, semantic colors), font families, border radius scale, shadow/glow presets. Every component must consume these tokens (via Tailwind config extension pointing to this file, or CSS variables generated from it) — never hardcode a hex color or font name directly in a component.

---

## 6. Internationalization Details

- All static UI strings (buttons, labels, menus, messages) → translation JSON files per language, loaded via i18next.
- Dynamic content stored in the database that needs translation (**product name, product description, category name, collection name**) must be stored as a multi-language object per field, e.g.:
  ```json
  { "name": { "ar": "...", "fr": "...", "en": "..." } }
  ```
- On product/category creation, if the admin only fills one language, **automatically machine-translate** the other two (use any reasonable free/low-cost translation API or library — document which one you chose and why, and put its API key, if any, in `.env`). The admin must always be able to manually override/edit any of the 3 language fields afterward in the dashboard.
- Email/notification templates (if any) should also support the 3 languages based on customer's preferred language if stored, otherwise default to Arabic.

---

## 7. Algerian Wilayas — Seed Data (69 wilayas, 2026 administrative division)

Seed a `wilayas` collection with all 69 wilayas (58 original + 11 newly created in 2026). Use this exact list (code — name in Arabic; add French/English names yourself using standard transliterations):

01 أدرار, 02 الشلف, 03 الأغواط, 04 أم البواقي, 05 باتنة, 06 بجاية, 07 بسكرة, 08 بشار, 09 البليدة, 10 البويرة, 11 تمنراست, 12 تبسة, 13 تلمسان, 14 تيارت, 15 تيزي وزو, 16 الجزائر, 17 الجلفة, 18 جيجل, 19 سطيف, 20 سعيدة, 21 سكيكدة, 22 سيدي بلعباس, 23 عنابة, 24 قالمة, 25 قسنطينة, 26 المدية, 27 مستغانم, 28 المسيلة, 29 معسكر, 30 ورقلة, 31 وهران, 32 البيض, 33 إليزي, 34 برج بوعريريج, 35 بومرداس, 36 الطارف, 37 تندوف, 38 تيسمسيلت, 39 الوادي, 40 خنشلة, 41 سوق أهراس, 42 تيبازة, 43 ميلة, 44 عين الدفلى, 45 النعامة, 46 عين تموشنت, 47 غرداية, 48 غليزان, 49 تيميمون, 50 برج باجي مختار, 51 أولاد جلال, 52 بني عباس, 53 إن صالح, 54 إن قزام, 55 توقرت, 56 جانت, 57 المغير, 58 المنيعة, 59 أفلو, 60 بريكة, 61 القنطرة, 62 بئر العاتر, 63 العريشة, 64 قصر الشلالة, 65 عين وسارة, 66 مسعد, 67 قصر البخاري, 68 بوسعادة, 69 الأبيض سيدي الشيخ

## 8. Other Seed Data

Since the owner will upload real product files manually later, seed **realistic Algerian-context placeholder data only** (no real files needed — use placeholder image URLs or leave file fields empty/nullable):
- 1 Admin user account (seeded credentials — document them clearly in the final report; must be changed after first login).
- ~8–12 realistic product categories relevant to 3D printing (e.g., Home Decor, Gadgets & Tools, Toys & Games, Cosplay & Props, Miniatures, Mechanical Parts, Jewelry, Educational Models...).
- 2–3 collections grouping some of those categories.
- ~15–20 sample products distributed across categories, with Algerian-relevant naming/pricing in DZD, multi-language name/description fields populated (at least Arabic + French, English can be auto-translated).
- A handful of sample customers and sample orders (in different statuses: Pending, Confirmed, Rejected, Completed) referencing real wilaya names, so the admin dashboard/orders/analytics screens aren't empty on first run.
- A few sample approved reviews on some products.

---

## 9. Progress Tracking — `progress.md`

Before writing any code, create a `progress.md` file at the project root containing a full checklist of every task you plan to execute, grouped by phase (e.g., Backend Setup, Database & Models, Repositories, Services, API Endpoints/Auth, Seed Data, Frontend Setup, i18n & Theme Setup, Feature-by-feature Frontend Screens, Admin Dashboard Screens, Testing/Verification, Git & GitHub, Final Report). Use checkbox syntax `- [ ]` / `- [x]`.

**After completing each meaningful task**, immediately update `progress.md`: mark it `- [x]`, and add a short note if anything deviated from plan. This file must always reflect the true current state of the project so that work can be resumed from a clean read of this file alone if interrupted at any point. Do not batch updates — update as you go, not at the end.

---

## 10. Version Control

- Do **not** create intermediate commits per task.
- Only at the very end, once the entire application (backend + frontend + seed data) runs successfully locally:
  1. Initialize git (if not already), add a proper `.gitignore` (exclude `.env`, `node_modules`, `bin/obj`, etc.), and make a single well-described initial commit locally.
  2. Create a new GitHub repository named `3d-dz` and push this commit to it.
  3. Report the repository URL in the final report.

---

## 11. Final Deliverable — Comprehensive Report

At the very end, produce a `REPORT.md` (or similar) covering:
1. Architecture overview (backend layers, frontend folder structure) with a short rationale for the state-management and styling library choices.
2. Data model summary (main MongoDB collections/entities and their key fields).
3. **Step-by-step local setup & run instructions** from a clean clone: prerequisites (.NET 10 SDK, Node version, etc.), how to fill `.env` files (backend and frontend) with MongoDB Atlas / ImageKit / JWT secret / translation API values, how to restore/build/run the backend, how to install/run the frontend, how to run the seeders, default admin login credentials, and how to access the customer site vs. the admin dashboard.
4. Known limitations / things intentionally left for later (e.g., RTL polish, real product file uploads, payment/email provider integration).
5. The final GitHub repository link.

---

## 12. Ambiguity Policy (important)

If at any point you find:
- A user story that is unclear or contradicts another,
- A missing technical detail needed to proceed (e.g., specific translation API to use, JWT secret handling detail, exact analytics metrics),
- A design element in the exported Stitch screens that doesn't map cleanly to a reusable pattern,

**pause and ask the user a clear, specific question** rather than assuming silently. Batch related questions together instead of asking one at a time when possible. Log any assumption you *did* have to make (because the user was unavailable) clearly in `progress.md` and `REPORT.md` so it can be revisited.

---

**Begin now** by: (1) reading `requirements.md` and `flows.md` fully, and inspecting all exported design screens in the `design/` folder, (2) asking any clarifying questions you have about this document, then (3) creating `progress.md` with your full task breakdown before writing any code.