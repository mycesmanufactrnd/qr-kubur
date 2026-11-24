# Ahli Kariah status on the user side (built 2026-11-24)

No account linking: a user looks up their membership on `User/UserKariahRegistration.jsx` with
**IC + mosque**, and can "Save" it on the device. The dashboard's "Kariah Member" card (Location &
Places) and `MosqueDetails.jsx`'s Register/Check-Status button read that saved record.

- **Lookup**: `deathCharityMember.checkKariahStatus` — public, rate-limited, returns only
  `{ isapproved, mosque: { id, name } }` or `null`. Never name/IC/contact. Don't swap the user page
  back to `searchByIcNumber` (that one returns the full decrypted record; admin pages need it).
- **Saved record**: always go through `src/utils/kariahMembership.ts` — never read localStorage
  directly. Key is `kariahRegisteredMember:google:<id>` per signed-in Google user, `…:guest`
  otherwise, so users sharing a device don't see each other's record. Holds IC + mosqueId +
  mosqueName + isApproved only. The old unscoped `kariahRegisteredMember` key is deleted on read.
- **Revalidation**: `useSavedKariahMembership()` (in `useDeathCharityMemberMutations.ts`) re-checks
  on mount. Status/mosque name are updated; a `null` result (rejected = row deleted, or moved mosque)
  clears the saved record; a failed request keeps it.
- A guest record stays visible to anyone using the device signed-out, and a signed-out user's own
  record stays in storage under their id (not shown to others) — sign-out doesn't clear it.

Parent: [[index|frontend-conventions/]].
