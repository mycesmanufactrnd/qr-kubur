import * as XLSX from "xlsx";
import { AppDataSource } from "../datasource.ts";
import { Grave, Organisation, User } from "../db/entities.ts";
import { GraveStatus } from "../db/enums.ts";

/**
 * Parses a CSV or XLSX buffer into an array of row objects.
 * Uses the first row as header keys.
 * `createdAt` is intentionally omitted — TypeORM's @CreateDateColumn sets it automatically.
 */
export function parseSpreadsheet(buffer: Buffer): Record<string, any>[] {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
}

function mapRowToGrave(row: Record<string, any>, createdbyId?: number | null, organisation?: Organisation | null) {
  const statusRaw = String(row.status || "")
    .trim()
    .toLowerCase();
  const validStatuses = Object.values(GraveStatus) as string[];

  return {
    name: String(row.name || "").trim() || null,
    state: String(row.state || "").trim() || null,
    block: row.block ? String(row.block).trim() : null,
    lot: row.lot ? String(row.lot).trim() : null,
    address: row.address ? String(row.address).trim() : null,
    latitude: row.latitude !== "" ? parseFloat(row.latitude) : null,
    longitude: row.longitude !== "" ? parseFloat(row.longitude) : null,
    picname: row.picname ? String(row.picname).trim() : null,
    picphoneno: row.picphoneno ? String(row.picphoneno).trim() : null,
    totalgraves:
      row.totalgraves !== "" ? parseInt(String(row.totalgraves), 10) : null,
    photourl: row.photourl ? String(row.photourl).trim() : null,
    status: validStatuses.includes(statusRaw)
      ? (statusRaw as GraveStatus)
      : GraveStatus.ACTIVE,
    createdbyId: createdbyId ?? null,
    organisation: organisation ?? null,
  };
}

export interface BulkImportResult {
  count: number;
  errors: string[];
}

/**
 * Parses a CSV or XLSX buffer and bulk-inserts graves into the database.
 * `createdAt` is auto-set by TypeORM's @CreateDateColumn — no need to pass it.
 *
 * @param buffer   Raw file buffer (CSV or XLSX)
 * @param createdbyId  Optional ID of the user performing the upload
 */
export async function bulkImportGraves(
  buffer: Buffer,
  createdbyId?: number | null,
): Promise<BulkImportResult> {
  const rows = parseSpreadsheet(buffer);

  const graveRepo = AppDataSource.getRepository(Grave);

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoin("user.organisation", "organisation")
    .addSelect(["organisation.id"])
    .where("user.id = :id", { id: Number(createdbyId) })
    .getOne();

  const errors: string[] = [];
  const graves: Partial<Grave>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is header

    if (!row.name || String(row.name).trim() === "") {
      errors.push(`Row ${rowNum}: missing required field "name"`);
      continue;
    }
    if (!row.state || String(row.state).trim() === "") {
      errors.push(`Row ${rowNum}: missing required field "state"`);
      continue;
    }

    graves.push(mapRowToGrave(row, createdbyId, user?.organisation));
  }

  if (graves.length > 0) {
    await graveRepo.save(graves as Grave[]);
  }

  return { count: graves.length, errors };
}
