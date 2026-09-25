import "reflect-metadata";
import { AppDataSource } from "../../datasource.js";
import { encryptField, decryptField, hashForSearch } from "../../helpers/cryptoHelper.js";

const CIPHERTEXT_PREFIX = "enc:v1:";

/**
 * One-off backfill for the newly-encrypted PDPA fields added alongside
 * DeadPerson.icnumber: encrypts any plaintext value still in the DB and
 * (re)computes deathcharitymember.icnumberhash so exact-match IC lookups
 * keep working. Safe to run more than once — already-encrypted values are
 * left alone (icnumber is only re-hashed, never re-encrypted).
 */

async function encryptPlainColumn(table: string, column: string) {
  const rows: { id: number; value: string }[] = await AppDataSource.query(
    `SELECT id, "${column}" AS value FROM ${table} WHERE "${column}" IS NOT NULL`,
  );

  let migrated = 0;
  for (const row of rows) {
    if (row.value.startsWith(CIPHERTEXT_PREFIX)) continue;
    const ciphertext = encryptField(row.value);
    await AppDataSource.query(
      `UPDATE ${table} SET "${column}" = $1 WHERE id = $2`,
      [ciphertext, row.id],
    );
    migrated++;
  }

  console.log(`✔ ${table}.${column}: encrypted ${migrated}/${rows.length} row(s)`);
}

async function encryptIcNumberWithHash(table: string) {
  const rows: { id: number; icnumber: string }[] = await AppDataSource.query(
    `SELECT id, icnumber FROM ${table} WHERE icnumber IS NOT NULL`,
  );

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
        `UPDATE ${table} SET icnumberhash = $1 WHERE id = $2`,
        [hash, row.id],
      );
      rehashedOnly++;
    } else {
      const ciphertext = encryptField(plainValue);
      await AppDataSource.query(
        `UPDATE ${table} SET icnumber = $1, icnumberhash = $2 WHERE id = $3`,
        [ciphertext, hash, row.id],
      );
      migrated++;
    }
  }

  console.log(
    `✔ ${table}.icnumber: encrypted ${migrated}, re-hashed ${rehashedOnly} (of ${rows.length})`,
  );
}

async function run() {
  await AppDataSource.initialize();

  try {
    await encryptIcNumberWithHash("deathcharitymember");
    await encryptPlainColumn("deathcharitymember", "phone");
    await encryptPlainColumn("deathcharitymember", "email");

    await encryptPlainColumn("deadperson", "causeofdeath");

    await encryptPlainColumn("quotation", "payerphone");
    await encryptPlainColumn("quotation", "payeremail");

    await encryptPlainColumn("tahlilrequest", "requestorphoneno");
    await encryptPlainColumn("tahlilrequest", "requestoremail");

    await encryptPlainColumn("donation", "donorphoneno");
    await encryptPlainColumn("donation", "donoremail");
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
