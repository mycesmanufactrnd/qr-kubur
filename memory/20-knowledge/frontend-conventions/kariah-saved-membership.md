# Ahli Kariah registration & status (user side built 2026-11-24, moved to `qariahmember` 2026-11-25)

`User/UserKariahRegistration.jsx` is the **original page layout** (user decision 2026-11-26: a
Daftar/Semak choice screen and gender/family/postcode/city/state fields were built 2026-11-25 and then
reverted on request): pick state + mosque + IC → **Cari**; if not found, the original 5-field form
(name, IC, phone, email, address) appears below it. UI tidied 2026-11-26 (same flow): a step indicator (Semak→Daftar; once a registration is found it
switches to Menunggu→Diluluskan approval progress), Semak Semula in the search card's title row, the
search card collapses to a Masjid · Negeri · IC summary after Cari (inputs stay mounted but hidden so
the form keeps their values), and the not-found note + fields + submit sit in one card. Only the wiring differs from the original: the
lookup is `qariahMember.checkStatus` (so no "Name" row) and submit goes to `qariahMember.register`
with the Google link. A found registration can be "Saved" on the device; the registration page and
`MosqueDetails.jsx`'s Register/Check-Status button read that saved record. The backend still accepts
(optional) gender/family/address-detail fields and the admin pages show them if present.

- **Table**: registrations go to `qariahmember` (`QariahMember` entity, router `qariahMember`,
  hooks `src/mutations/useQariahMemberMutations.ts`). `deathcharitymember` / `registerKariah` /
  `ManageKariahMember` are the held death-charity side — don't route kariah registration back there.
- **Status lookup**: `qariahMember.checkStatus` — public, rate-limited, returns only
  `{ isapproved, mosque: { id, name } }` or `null` (none, or rejected). Never name/IC/contact.
- **Admin**: `ManageQariahRegistration` (desktop + `Mobile/`), approve/reject (reject keeps the row
  with `status=rejected` + `notes`; the IC may register again). Scoped **server-side**: superadmin =
  all; admin/employee = mosques of their own organisation; no org or `google` role = FORBIDDEN.
  The admin dashboard's "Kelulusan Ahli Kariah" tile and `KariahRegistrationAlert` read the same list.
- **Google link** (2026-11-25): `register` takes an optional `googleIdToken` (from `getGoogleIdToken()` in
  `src/utils/auth.ts` — web SDK `auth.currentUser`, or the Capacitor `FirebaseAuthentication` plugin on
  native; null unless the app has a stored Google user). The backend verifies it with
  `verifyFirebaseIdToken`, finds `googleuser` by email, and sets `googleUserId`. Never accept a raw
  `googleUserId` from the client here (other routers do — donation, payment, billplz, familyTree —
  which is spoofable). No/invalid token -> registers unlinked. `googleUserId` = "submitted from this
  account", not "is the account owner".
- **Saved record**: always via `src/utils/kariahMembership.ts`. Key `kariahRegisteredMember:google:<id>`
  per signed-in Google user, `…:guest` otherwise. Holds IC + mosqueId + mosqueName + isApproved only.
- **Revalidation**: `useSavedKariahMembership()` re-checks on every mount. Pitfall: the app's global
  query default is `refetchOnMount: false`, so `useCheckKariahStatus` sets `refetchOnMount: true`
  explicitly — without it, in-app navigation back shows the stale cached status.
- **"Masjid Berdaftar"** (2026-11-26, user correction: the dashboard card must list the user's
  mosques, not duplicate the "Pendaftaran Kariah" quick action): Location & Places card →
  `User/MyKariahMosques.jsx`, Google-gated like Family Tree. Data: `qariahMember.listMine` (mutation so
  the Firebase token is in the POST body, not a GET URL), hook `useMyQariahRegistrations`. Dashboard (2026-11-26): when signed in and the
  user has approved/pending registrations, a separate "Masjid Berdaftar" section (after Location &
  Places) shows non-clickable membership cards — mosque photo banner (gradient fallback), status badge,
  member name, negeri, registered date; swipe when >1 (user asked for its own look, not nav rows). The
  Location & Places card is hidden then; rejected ones only
  on the full page. No registrations / not signed in → the card. Only
  registrations linked to the account appear — guest/unlinked ones (e.g. made signed-out) do not.
- **Pitfall**: never throw `UNAUTHORIZED` from a Google-user endpoint — `main.jsx`'s global
  `handleAuthError` treats it as an expired *admin* session (refresh, then `clearSession()`). Use
  `FORBIDDEN`.
- A guest record is visible to anyone using the device signed-out; sign-out doesn't clear a user's
  own record (kept under their id, not shown to others).

Parent: [[index|frontend-conventions/]].
