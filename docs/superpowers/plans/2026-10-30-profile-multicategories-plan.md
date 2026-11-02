# Profile Multi-Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hydrate the authenticated user's profile and save multiple real categories/subcategories with one primary selection of each.

**Architecture:** Query the authenticated user's profile and the live `categories`/`subcategories` relation from Supabase. Store selected UUIDs in arrays, selected primary UUIDs separately, and keep the legacy singleton columns synchronized. Append the profile migration to the shared `supabase/schema_v4.sql` created by the identity/benefits plan.

**Tech Stack:** Next.js 16.4.3, React 19, TypeScript, Supabase JS, Node.js built-in test runner.

**Spec:** [2026-10-30-mega-update-ux-profile-waitlist-design.md](../specs/2026-10-30-mega-update-ux-profile-waitlist-design.md)

## Global Constraints

- Persist `category_ids UUID[]`, `subcategory_ids UUID[]`, `primary_category_id UUID`, and `primary_subcategory_id UUID`.
- Continue writing legacy `category_id` and `subcategory_id` from the primary selections.
- Read category/subcategory UUIDs from Supabase; do not save static numeric subcategory IDs.
- Preserve current profile values when arrays are empty by falling back to legacy singleton IDs.
- Do not silently display an empty form after profile/query errors.
- Keep user-facing errors actionable and avoid destructive profile updates.

## Review Focus

- Existing profiles with only legacy IDs must hydrate with those choices selected; test the legacy fallback.
- A selected primary category removed from the selection must be replaced or cleared; test selection invariants.
- A primary subcategory must belong to the selected primary category and be selected; test both invalid cases.
- A failed category/profile query must end loading with a visible error, not a blank editable profile; test the load state.
- Image upload or profile update errors must not be reported as a successful save; test surfaced error behavior.

---

### Task 1: Define and test category selection state

**Files:**
- Create: `src/lib/profile/category-selection.ts`
- Create: `tests/profile-category-selection.test.mjs`

**Interfaces:**
- Produces:
  - `ProfileCategorySelection` with `categoryIds`, `subcategoryIds`, `primaryCategoryId`, `primarySubcategoryId`;
  - `hydrateCategorySelection(profile): ProfileCategorySelection`;
  - `toggleCategory(selection, categoryId, checked, subcategoryCategoryById): ProfileCategorySelection`;
  - `toggleSubcategory(selection, subcategoryId, checked, subcategoryCategoryById): ProfileCategorySelection`;
  - `selectPrimaryCategory(selection, categoryId, subcategoryCategoryById): ProfileCategorySelection`;
  - `selectPrimarySubcategory(selection, subcategoryId, subcategoryCategoryById): ProfileCategorySelection`.

- [ ] **Step 1: Write failing behavior tests**

Use `node:test` to assert:
  - empty arrays hydrate from `category_id`/`subcategory_id`;
  - toggling a category adds/removes only that category and its subcategories;
  - deselecting the primary category clears or selects the first remaining category deterministically;
  - selecting a primary category clears an incompatible primary subcategory;
  - a primary subcategory is accepted only when selected and owned by the primary category.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/profile-category-selection.test.mjs`
Expected: FAIL because the selection helper does not exist.

- [ ] **Step 3: Implement the pure selection helpers**

Use immutable arrays and a `Record<string, string>` map from subcategory UUID to parent category UUID. Return fresh state without mutating inputs. Do not invent category IDs or cast unrelated types.

- [ ] **Step 4: Run tests**

Run: `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/profile-category-selection.test.mjs`
Expected: PASS.

### Task 2: Add profile schema and preserve existing selections

**Files:**
- Modify: `supabase/schema_v4.sql`
- Modify: `src/types/database.ts`
- Create: `tests/profile-schema-contract.test.mjs`

**Interfaces:**
- Consumes: the existing `profiles.category_id` and `profiles.subcategory_id`.
- Produces: four typed profile fields and an additive/idempotent SQL migration.

- [ ] **Step 1: Write the failing schema contract test**

Assert the SQL adds the four expected fields with UUID/UUID-array types, backfills empty arrays from the old singleton columns, and does not drop or rename legacy columns. Assert `Database.profiles.Row`, `Insert`, and `Update` include the four fields.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/profile-schema-contract.test.mjs`
Expected: FAIL because the profile migration/type contract is absent.

- [ ] **Step 3: Add columns and legacy backfill**

Append `category_ids UUID[] NOT NULL DEFAULT '{}'`, `subcategory_ids UUID[] NOT NULL DEFAULT '{}'`, `primary_category_id UUID REFERENCES categories(id)`, and `primary_subcategory_id UUID REFERENCES subcategories(id)` with `ADD COLUMN IF NOT EXISTS`. Backfill only rows whose arrays are empty, using legacy values for both arrays and primary columns. Do not overwrite populated arrays.

- [ ] **Step 4: Update database TypeScript types**

Add array and nullable primary fields to `profiles.Row`, `.Insert`, and `.Update` with UUIDs represented as `string` and arrays as `string[]`.

- [ ] **Step 5: Run the schema contract test**

Run: `node --test tests/profile-schema-contract.test.mjs`
Expected: PASS.

### Task 3: Hydrate and save profile using live categories

**Files:**
- Modify: `src/app/perfil/page.tsx`
- Modify: `src/types/database.ts` if category relation types are needed
- Create: `tests/profile-page-contract.test.mjs`

**Interfaces:**
- Consumes: `ProfileCategorySelection` helpers from Task 1 and the profile columns from Task 2.
- Produces: profile form loaded from the authenticated user's record and live category data.

- [ ] **Step 1: Write a failing profile contract test**

Assert the page queries the profile by authenticated user ID, loads category/subcategory rows from Supabase, invokes `hydrateCategorySelection`, and saves both arrays, both primary IDs, and legacy singleton IDs.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/profile-page-contract.test.mjs`
Expected: FAIL because the page still uses static category IDs and singleton state.

- [ ] **Step 3: Load profile and category data with explicit errors**

Fetch `auth.getUser()`, redirect unauthenticated users, then load the profile and categories/subcategories. Ensure every asynchronous path exits loading; show a visible error if a required query fails. Hydrate scalar profile fields as before and use the helper for category arrays, falling back to legacy fields.

- [ ] **Step 4: Implement multi-select and primary controls**

Render checkboxes for selected categories and their subcategories. Render one radio for the primary category and one radio for the primary subcategory, disabled unless it is selected and belongs to the primary category. Use the pure helper functions for all selection changes.

- [ ] **Step 5: Save selections and surface failures**

Update all existing profile fields plus `category_ids`, `subcategory_ids`, `primary_category_id`, and `primary_subcategory_id`; set legacy `category_id` and `subcategory_id` to their corresponding primary IDs. On missing user, upload failure, or update error, stop the saving state and show an explicit error. Do not show success on partial failure.

- [ ] **Step 6: Run tests and inspect the form**

Run: `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/profile-page-contract.test.mjs tests/profile-category-selection.test.mjs`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: exit code 0. Inspect the authenticated profile at desktop and mobile widths; existing values are present and primary controls remain usable.

### Task 4: Verify the profile workstream

- [ ] **Step 1: Run targeted lint**

Run: `npx eslint src/app/perfil/page.tsx src/lib/profile/category-selection.ts src/types/database.ts tests`
Expected: no lint errors in changed files.

- [ ] **Step 2: Review migration compatibility**

Run: `git diff --check` and inspect the profile section of `supabase/schema_v4.sql`.
Expected: rerunning the additive migration does not overwrite existing multi-select data or remove the legacy columns.
