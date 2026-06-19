//@ts-nocheck
import * as XLSX from "xlsx";
import { AppDataSource } from "../datasource.js";
import { Grave, Mosque, Organisation, User } from "../db/entities.js";
import { GraveStatus } from "../db/enums.js";

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

function safeFloat(val: any): number | null {
  if (val == null || val === "") return null;
  const n = parseFloat(String(val).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function safeInt(val: any, fallback = 0): number {
  if (val == null || val === "") return fallback;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : fallback;
}

function mapRowToGrave(
  row: Record<string, any>,
  createdbyId?: number | null,
  organisation?: Organisation | null,
) {
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
    latitude: safeFloat(row.latitude),
    longitude: safeFloat(row.longitude),
    picname: row.picname ? String(row.picname).trim() : null,
    picphoneno: row.picphoneno ? String(row.picphoneno).trim() : null,
    totalgraves: safeInt(row.totalgraves, 0),
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

function mapRowToMosque(
  row: Record<string, any>,
  createdbyId?: number | null,
  organisation?: Organisation | null,
) {
  const parseBool = (val: any) => {
    if (typeof val === "boolean") return val;
    const s = String(val).trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  };

  return {
    name: String(row.name || "").trim() || null,
    state: String(row.state || "").trim() || null,
    address: row.address ? String(row.address).trim() : null,
    email: row.email ? String(row.email).trim() : null,
    url: row.url ? String(row.url).trim() : null,
    latitude: safeFloat(row.latitude),
    longitude: safeFloat(row.longitude),
    picname: row.picname ? String(row.picname).trim() : null,
    picphoneno: row.picphoneno ? String(row.picphoneno).trim() : null,
    photourl: row.photourl ? String(row.photourl).trim() : null,
    canarrangefuneral: parseBool(row.canarrangefuneral),
    hasdeathcharity: parseBool(row.hasdeathcharity),
    createdbyId: createdbyId ?? null,
    organisation: organisation ?? null,
  };
}

export async function bulkImportMosques(
  buffer: Buffer,
  createdbyId?: number | null,
): Promise<BulkImportResult> {
  const rows = parseSpreadsheet(buffer);
  const mosqueRepo = AppDataSource.getRepository(Mosque);

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoin("user.organisation", "organisation")
    .addSelect(["organisation.id"])
    .where("user.id = :id", { id: Number(createdbyId) })
    .getOne();

  const errors: string[] = [];
  const mosques: Partial<Mosque>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name || String(row.name).trim() === "") {
      errors.push(`Row ${rowNum}: missing required field "name"`);
      continue;
    }
    if (!row.state || String(row.state).trim() === "") {
      errors.push(`Row ${rowNum}: missing required field "state"`);
      continue;
    }

    mosques.push(mapRowToMosque(row, createdbyId, user?.organisation));
  }

  if (mosques.length > 0) {
    await mosqueRepo.save(mosques as Mosque[]);
  }

  return { count: mosques.length, errors };
}
