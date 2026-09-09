import "reflect-metadata";
import { AppDataSource } from "../../datasource.js";
import { encryptField, decryptField, hashForSearch } from "../../helpers/cryptoHelper.js";

const CIPHERTEXT_PREFIX = "enc:v1:";

/**
 * One-off backfill: encrypts any DeadPerson.icnumber still stored as plaintext
 * (from before field encryption was added) and (re)computes icnumberhash for
 * every row so exact-match IC search keeps working. Safe to run more than
 * once — already-encrypted rows are only re-hashed, never re-encrypted.
 */
async function run() {
  await AppDataSource.initialize();

  try {
    const rows: { id: number; icnumber: string }[] = await AppDataSource.query(
      `SELECT id, icnumber FROM deadperson WHERE icnumber IS NOT NULL`,
    );

    console.log(`Found ${rows.length} deadperson row(s) with an icnumber`);

    let migrated = 0;
    let rehashedOnly = 0;

    for (const row of rows) {
      const alreadyEncrypted = row.icnumber.startsWith(CIPHERTEXT_PREFIX);
      const plainValue = alreadyEncrypted
        ? decryptField(row.icnumber)
        : row.icnumber;
      const hash = hashForSearch(plainValue);

      if (alreadyEncrypted) {
        await AppDataSource.query(
          `UPDATE deadperson SET icnumberhash = $1 WHERE id = $2`,
          [hash, row.id],
        );
        rehashedOnly++;
      } else {
        const ciphertext = encryptField(plainValue);
        await AppDataSource.query(
          `UPDATE deadperson SET icnumber = $1, icnumberhash = $2 WHERE id = $3`,
          [ciphertext, hash, row.id],
        );
        migrated++;
      }
    }

    console.log(`✔ Encrypted ${migrated} plaintext row(s)`);
    console.log(`✔ Re-hashed ${rehashedOnly} already-encrypted row(s)`);
  } finally {
    await AppDataSource.destroy();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  });
