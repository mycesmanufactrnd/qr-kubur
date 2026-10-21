# Parent organisation dashboard (Management Overview)

`src/pages/Dashboards/ParentAdminDashboard.jsx` — top-management view for a parent organisation:
Leaflet/OSM map of the organisation's own + child organisations, their mosques and graves, plus
aggregate KPIs, monthly arwah/jenazah (selected year vs previous), top 5 lists, per-state and
per-organisation breakdowns. Links to `AdminDashboard`; AdminDashboard (web + mobile) links back.

## Who counts as "parent"

`dashboardRouter.getParentOrgStatus` → `isParent` when the user's organisation type name is
**"Majlis Agama Islam"** (user decision, 2026-10-21) **or** it has direct child organisations.
OrganisationType has no code column — matched by its unique `name`. Frontend hook:
`useIsParentOrganisation` (`src/mutations/useDashboardMutations.ts`).

Parent users land on it after password login (`auth.ts` `getOrganisationHomePage`), get a
"Management Overview" sidebar item and logo link (`Layout.jsx`). Non-parents hitting the page are
redirected to AdminDashboard.

## Pitfalls

- **Scope comes from `ctx.user`, not client input** (`resolveOrgFamily`): user → organisation →
  self + direct children (one level, no grandchildren). Consequence: during superadmin
  **impersonation** the token is still the superadmin's, so the parent check is false and the page
  is unavailable.
- Returns aggregates + public names/coordinates only (no IC, cause of death, grave PIC contact).
- The older `dashboard.get*AdminStates` procedures trust a client-sent org id, and only OS/GD
  include child orgs; CQN/CMC/QUO/DDV are own-org only. Known bugs seen there: DDV `donationVerified`
  sums only ids from the *pending* list (≈ always 0 for org admins); OS suggestion count compares
  `suggestion.graveId` to the org id.
- Arwah monthly series uses `deadperson.dateofdeath`; jenazah uses `jenazahcase.createdat`.

Parent: [[index|dashboards/]].
