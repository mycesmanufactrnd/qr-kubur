# Password hashing

Passwords are hashed **only on the backend**: `backend/src/helpers/passwordHelper.ts` (bcrypt, 12
rounds) in `usersRouter` create/update and `tempOrganisationRouter`. Login (`authRouter`) sends the
plain password and `bcrypt.compare`s it. Pre-bcrypt accounts stored unsalted SHA-256; login
recognises those and upgrades them to bcrypt.

**Pitfall (fixed 2026-10-21):** ManageUsers, ManageOrganisations and ManageTahfizCenters (web and
mobile) also SHA-256'd the password in the browser (`src/utils/helpers.ts` `hashPassword`), so the
DB stored `bcrypt(sha256(pw))` and login always failed with "Invalid credentials". Pages now send the
plain password. **Never pre-hash a password on the frontend.** Accounts saved during the bug still
hold `bcrypt(sha256(pw))` and need their password set again.

`hashPassword` in `src/utils/helpers.ts` is now unused (its removal was blocked by a permission
check; safe to delete).

Parent: [[index|security/]].
