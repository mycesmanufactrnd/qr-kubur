import { AppDataSource } from "../datasource.ts";
import { StoredFile } from "../db/entities/StoredFile.entity.ts";

export type CreateStoredFileInput = {
  bucket: string;
  key: string;
  originalName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedById?: number | null;
};

export const createStoredFile = async (input: CreateStoredFileInput) => {
  const repo = AppDataSource.getRepository(StoredFile);
  const row = repo.create({
    bucket: input.bucket,
    key: input.key,
    originalName: input.originalName ?? null,
    contentType: input.contentType ?? null,
    sizeBytes: input.sizeBytes ?? null,
    uploadedById: input.uploadedById ?? null,
  });
  return await repo.save(row);
};

export const findStoredFile = async (bucket: string, key: string) => {
  const repo = AppDataSource.getRepository(StoredFile);
  return await repo.findOne({ where: { bucket, key } });
};

