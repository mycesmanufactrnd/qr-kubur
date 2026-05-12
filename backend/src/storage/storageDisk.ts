import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import type { Storage, PutObjectInput, PutObjectResult, GetObjectResult } from "./storage.ts";

const assertSafePath = (rootDir: string, targetPath: string) => {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep) && resolvedTarget !== resolvedRoot) {
    throw new Error("Unsafe storage path resolution");
  }
};

export class DiskStorage implements Storage {
  driver: "disk" = "disk";
  #rootDir: string;

  constructor(rootDir: string) {
    this.#rootDir = rootDir;
  }

  async check() {
    await fsp.mkdir(this.#rootDir, { recursive: true });
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    await this.check();
    const bucketDir = path.join(this.#rootDir, input.bucket);
    assertSafePath(this.#rootDir, bucketDir);
    await fsp.mkdir(bucketDir, { recursive: true });

    const objectPath = path.join(bucketDir, input.key);
    assertSafePath(this.#rootDir, objectPath);

    await fsp.writeFile(objectPath, input.body);

    const result: PutObjectResult = {
      bucket: input.bucket,
      key: input.key,
      sizeBytes: input.body.length,
    };
    if (input.contentType) result.contentType = input.contentType;
    return result;
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult | null> {
    await this.check();
    const objectPath = path.join(this.#rootDir, bucket, key);
    assertSafePath(this.#rootDir, objectPath);

    try {
      const stat = await fsp.stat(objectPath);
      if (!stat.isFile()) return null;
      return { stream: fs.createReadStream(objectPath), sizeBytes: stat.size };
    } catch (err: any) {
      if (err?.code === "ENOENT") return null;
      throw err;
    }
  }
}
