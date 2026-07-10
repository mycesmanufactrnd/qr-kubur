# CLAUDE.md

## Internationalization (i18n) — mandatory

All user-facing text must go through `translate("...")` from `@/utils/translations`.

Whenever you add or change a `translate("...")` call, add the exact same key to **all three** locale files, each with a real translation (not just copying the English string):

- `src/i18n/en.json`
- `src/i18n/ms.json`
- `src/i18n/ar.json`

Rules:
- The key (the English string passed to `translate()`) must match exactly across all three files.
- `en.json` value is normally the same as the key. `ms.json` and `ar.json` must contain actual Malay / Arabic translations, not the English text.
- Do this for every new `translate()` call in the same change — don't defer it or add it to only one file.
- Before finishing a task that touched UI copy, grep the new/changed `translate("...")` keys against all three `src/i18n/*.json` files to confirm none are missing.
