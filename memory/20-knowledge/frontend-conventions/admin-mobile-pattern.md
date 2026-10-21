# Admin Management Pages Need a Mobile Counterpart

Every new admin "Manage" page is expected to work in a narrow/mobile viewport (web responsive **and**
the Capacitor-wrapped app, which shares the same `dist/` build — see
[[../../10-architecture/overview|10-architecture/overview.md]]). There is no single adaptive
component; the convention is a **desktop/mobile split at the page level**.

## The pattern (confirmed in 25+ of 38 files under `src/pages/Management/`)

1. Desktop view: a `ManageXDesktop` component (table-based, uses `src/components/ui/table.jsx`)
   defined inside `src/pages/Management/ManageX.jsx`.
2. Mobile view: a separate `src/pages/Mobile/ManageX.jsx` — a card-list UI, not the same component
   reused with CSS breakpoints.
3. The wrapper exported from `src/pages/Management/ManageX.jsx` switches between them with
   `useIsNarrow()`:

```jsx
import { useIsNarrow } from "@/hooks/useIsNarrow";
import MobileManageX from "@/pages/Mobile/ManageX";

export default function ManageX() {
  const isNarrow = useIsNarrow(); // default threshold 1024px, window.matchMedia
  if (isNarrow) return <MobileManageX />;
  return <ManageXDesktop />;
}
```

Confirmed examples: `src/pages/Management/ManageDeadPersons.jsx:88-89`,
`ManageJenazahCase.jsx:2327-2328`, `ManageGraves.jsx:75-76`, `ManageInventoryPackages.jsx:223-224`,
`ManagePermissions.jsx:30-31`, `ManageQuotations.jsx:1134-1135`, `InventoryAudit.jsx:417-418`,
`InventoryDashboard.jsx:89-90`, `ManageNotifyDeathKariah.jsx:46-47`, `ManageKariahMember.jsx:85-86`.

## Don't confuse the two mobile hooks

- `src/hooks/useIsNarrow.js` — `useIsNarrow(threshold = 1024)`, `window.matchMedia` based. **This is
  the one the Management-page desktop/mobile split uses.**
- `src/hooks/use-mobile.jsx` — `useIsMobile()`, 768px breakpoint. Used for sidebar/dialog behavior
  elsewhere, **not** part of this pattern. Don't reach for it when building a new Manage page's
  mobile view.

## No shared responsive-table component

`src/components/ui/` has only `table.jsx` and `card.jsx` — no generic `ResponsiveTable`. Each page
hand-rolls its own desktop table + mobile card list. `src/components/mobile/` only has supporting
widgets (`AdvancedFilters`, `DraggableFloatingButton`, `FilterDrawer`, `MobileEmptyList`,
`PullToRefresh`) to use inside a `Mobile/ManageX.jsx`, not a table/card abstraction itself.

## Coverage gap — not yet universal

As of 2026-10-12, these admin pages have **no** mobile handling at all (no `useIsNarrow`, no
`useIsMobile`, no `Mobile/ManageX.jsx`, no responsive breakpoints found): `ManageGraveMapping`,
`ManageHeritageSites`, `ManageInventoryItems`, `ManageOrganisationTypes`,
`ManagePaymentDistribution`, `ManagePaymentFields`, `ManagePaymentPlatforms`, `ManageSuggestions`,
`ManageTempOrganisations`, `ManageWaqfProject`, `ManageCollectionTree`, `ManageIslamicEvent`,
`ManageDeathCharityClaim`. Treat the pattern above as the convention to follow for **new** pages, not
proof every existing page already does it — don't copy one of these gap pages as a reference.

## When building a new admin management page

1. Build the desktop table view as usual.
2. Add `src/pages/Mobile/ManageX.jsx` as a card-list view of the same data/actions.
3. Wire both with `useIsNarrow()` exactly as shown above.
4. If the new page touches personal data, this is on top of — not instead of — the PDPA/encryption
   checks in [[../../60-compliance/pdpa-malaysia|60-compliance/pdpa-malaysia.md]] and
   [[../security/field-encryption|../security/field-encryption.md]].

Related: [[mutation-hooks-pattern]] · [[../../10-architecture/frontend-patterns|10-architecture/frontend-patterns.md]].
