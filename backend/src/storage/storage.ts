import path from "path";
import { DiskStorage } from "./storageDisk.ts";
import { S3Storage } from "./storageS3.ts";

export type StorageDriver = "disk" | "s3";

export type PutObjectInput = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
};

export type PutObjectResult = {
  bucket: string;
  key: string;
  sizeBytes: number;
  contentType?: string;
};

export type GetObjectResult = {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  sizeBytes?: number;
};

export interface Storage {
  driver: StorageDriver;
  check(): Promise<void>;
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  getObject(bucket: string, key: string): Promise<GetObjectResult | null>;
}

let cachedStorage: Storage | null = null;

export const getStorage = (): Storage => {
  if (cachedStorage) return cachedStorage;

  const driver = (process.env.STORAGE_DRIVER ?? "disk") as StorageDriver;

  if (driver === "disk") {
    const rootDir =
      process.env.STORAGE_DISK_ROOT ??
      (process.env.DOCKER === "true"
        ? "/usr/src/app/storage_data"
        : path.resolve(process.cwd(), "storage_data"));
    cachedStorage = new DiskStorage(rootDir);
    return cachedStorage;
  }

  if (driver === "s3") {
    cachedStorage = new S3Storage();
    return cachedStorage;
  }

  throw new Error(
    `Unsupported STORAGE_DRIVER: ${String(process.env.STORAGE_DRIVER)}`,
  );
};
