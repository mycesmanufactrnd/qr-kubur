import type { Storage, PutObjectInput, PutObjectResult, GetObjectResult } from "./storage.js";

type S3ClientLike = any;

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required when STORAGE_DRIVER=s3`);
  return value;
};

export class S3Storage implements Storage {
  driver: "s3" = "s3";
  #clientPromise: Promise<S3ClientLike> | null = null;

  async #getClient(): Promise<S3ClientLike> {
    if (this.#clientPromise) return this.#clientPromise;

    this.#clientPromise = (async () => {
      // Lazy import so disk users don't need AWS SDK installed.
      // If you want S3 support, install: @aws-sdk/client-s3
      let mod: any;
      try {
        mod = await import("@aws-sdk/client-s3");
      } catch {
        throw new Error(
          "Missing dependency for S3 storage. Install @aws-sdk/client-s3 in backend/.",
        );
      }

      const region = process.env.S3_REGION ?? "auto";
      const endpoint = process.env.S3_ENDPOINT;
      const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

      const { S3Client } = mod;
      return new S3Client({
        region,
        endpoint,
        forcePathStyle,
        credentials: process.env.S3_ACCESS_KEY_ID
          ? {
              accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
              secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
            }
          : undefined,
      });
    })();

    return this.#clientPromise;
  }

  async check() {
    // no-op: we validate required env at call sites
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const bucketName = requiredEnv("S3_BUCKET");
    const client = await this.#getClient();

    const key = `${input.bucket}/${input.key}`;

    const mod: any = await import("@aws-sdk/client-s3");
    const { PutObjectCommand } = mod;

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    const result: PutObjectResult = {
      bucket: input.bucket,
      key: input.key,
      sizeBytes: input.body.length,
    };
    if (input.contentType) result.contentType = input.contentType;
    return result;
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult | null> {
    const bucketName = requiredEnv("S3_BUCKET");
    const client = await this.#getClient();

    const mod: any = await import("@aws-sdk/client-s3");
    const { GetObjectCommand } = mod;

    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: `${bucket}/${key}`,
        }),
      );

      if (!res?.Body) return null;

      return {
        stream: res.Body as NodeJS.ReadableStream,
        contentType: res.ContentType,
        sizeBytes: typeof res.ContentLength === "number" ? res.ContentLength : undefined,
      };
    } catch (err: any) {
      const name = err?.name ?? err?.Code;
      if (name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  }
}
