# 20-knowledge - Folder Index

What was **learned building and operating QubuR** — pitfalls, contracts and conventions that are not
obvious from the code alone, split by domain. Unlike `10-architecture/`, this folder grows lazily:
a subfolder appears the first time a real pitfall or convention is actually found.

- **[[frontend-conventions/index|frontend-conventions/]]** -> The mutation-hooks copy-paste template.
- **[[security/index|security/]]** -> Field-level encryption (`encryptField`/`decryptField`/
  `hashForSearch`), how to add it to a new PII column.
- **[[legacy/index|legacy/]]** -> What's actually dead vs. live between the original Base44 scaffold,
  the leftover Supabase CLI state, and the real JWT/tRPC system.

Parent: [[../index|memory root]].
