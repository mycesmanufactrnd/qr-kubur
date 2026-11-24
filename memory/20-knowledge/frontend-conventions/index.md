# frontend-conventions - Folder Index

- **[[mutation-hooks-pattern|mutation-hooks-pattern.md]]** -> Copy-paste template for adding a new
  entity's `use<Entity>Mutations.ts` file: the query-hook shape, the mutations-hook shape,
  `invalidateAll()`, admin gating, and which existing files to copy from.
- **[[admin-mobile-pattern|admin-mobile-pattern.md]]** -> New admin "Manage" pages need a mobile
  view too: the `useIsNarrow()` desktop/mobile split, `src/pages/Mobile/ManageX.jsx` card-list
  convention, and which existing pages still lack it.
- **[[dialog-custom-animation|dialog-custom-animation.md]]** -> Replacing a Radix dialog's CSS
  animation with a grow-from-origin Web Animation (QR modal), and the ref re-attach flash pitfall.
- **[[kariah-saved-membership|kariah-saved-membership.md]]** -> How users see their Ahli Kariah
  status without an account: the narrow `checkKariahStatus` lookup, the per-user saved record in
  `utils/kariahMembership.ts`, and how it revalidates.

Parent: [[../index|20-knowledge/]].
