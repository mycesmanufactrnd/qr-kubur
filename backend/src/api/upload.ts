import { randomUUID } from 'crypto';
import type { FastifyInstance } from "fastify";
import path from "path";
import { verifyToken } from "../auth.js";
import { bulkImportGraves, bulkImportMosques, bulkImportTahfiz } from "../services/upload.service.js";
import { getStorage } from "../storage/storage.js";
import { createStoredFile, findStoredFile } from "../services/storageMetadata.service.js";
import type { StoredFileUploadedBy } from "../db/entities/StoredFile.entity.js";

const parseUploadedBy = (raw: string | undefined): StoredFileUploadedBy | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id);
    if (!Number.isFinite(id) || id <= 0) return null;

    const fullname =
      typeof parsed?.fullname === "string"
        ? parsed.fullname
        : typeof parsed?.name === "string"
          ? parsed.name
          : null;

    const organisationIdRaw = parsed?.organisationId ?? parsed?.organisation?.id;
    const tahfizcenterIdRaw = parsed?.tahfizcenterId ?? parsed?.tahfizcenter?.id;

    const organisationId = organisationIdRaw != null ? Number(organisationIdRaw) : null;
    const tahfizcenterId = tahfizcenterIdRaw != null ? Number(tahfizcenterIdRaw) : null;

    return {
      id,
      fullname,
      organisationId: Number.isFinite(organisationId) ? organisationId : null,
      tahfizcenterId: Number.isFinite(tahfizcenterId) ? tahfizcenterId : null,
    };
  } catch {
    return null;
  }
};

export const registerUploadRoutes = (app: FastifyInstance) => {
  
  app.post('/api/upload/:bucket', async (request, reply) => {
    try {
      const { bucket } = request.params as { bucket: string };

      let currentUserRaw: string | undefined;
      let filename: string | undefined;
      let mimetype: string | undefined;
      let buffer: Buffer | undefined;

      if (request.isMultipart && request.isMultipart()) {
        for await (const part of request.parts()) {
          if (part.type === "field" && part.fieldname === "currentUser") {
            currentUserRaw = String(part.value);
            continue;
          }

          if (part.type === "file" && part.fieldname === "file") {
            filename = part.filename;
            mimetype = part.mimetype;
            buffer = await part.toBuffer();
            continue;
          }

          // Always consume any extra files to avoid stalling multipart parsing.
          if (part.type === "file") {
            await part.toBuffer();
          }
        }
      } else {
        const file = await request.file();
        if (file) {
          filename = file.filename;
          mimetype = file.mimetype;
          buffer = await file.toBuffer();
          const candidate = file.fields?.currentUser;
          if (candidate && !Array.isArray(candidate) && (candidate as any).type === "field") {
            currentUserRaw = String((candidate as any).value);
          }
        }
      }

      if (!filename || !mimetype || !buffer) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      console.log("Uploading file:", filename, mimetype, "size:", buffer.length);

      const originalBaseName = path.basename(filename).replace(/[\\/:*?"<>|]+/g, "_");
      const safeName = `${randomUUID()}-${originalBaseName}`;

      console.log('New name:', safeName);

      const storage = getStorage();
      const result = await storage.putObject({
        bucket,
        key: safeName,
        body: buffer,
        contentType: mimetype,
      });

      const uploadedBy = parseUploadedBy(currentUserRaw) ?? (request.user?.id ? { id: Number(request.user.id) } : null);

      const stored = await createStoredFile({
        bucket: result.bucket,
        key: result.key,
        originalName: filename,
        contentType: result.contentType ?? null,
        sizeBytes: result.sizeBytes,
        uploadedBy,
      });

      return reply.send({ file_url: safeName, file_id: stored.id });
    } catch (err: any) {
      console.error("Upload failed:");
      console.error(err);
      return reply.status(500).send({ error: err.message || 'Upload failed' });
    }
  });

  app.post('/api/upload/graves/bulk', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      const user = token ? verifyToken(token) : null;
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowed.includes(file.mimetype) && !file.filename.match(/\.(csv|xlsx|xls)$/i)) {
        return reply.status(400).send({ error: 'Only CSV and Excel files are accepted' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const result = await bulkImportGraves(buffer, Number(user.id));
      return reply.send(result);
    } catch (err: any) {
      console.error('Bulk grave import failed:', err);
      return reply.status(500).send({ error: err.message || 'Import failed' });
    }
  });

  app.post('/api/upload/mosques/bulk', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      const user = token ? verifyToken(token) : null;
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowed.includes(file.mimetype) && !file.filename.match(/\.(csv|xlsx|xls)$/i)) {
        return reply.status(400).send({ error: 'Only CSV and Excel files are accepted' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const result = await bulkImportMosques(buffer, Number(user.id));
      return reply.send(result);
    } catch (err: any) {
      console.error('Bulk mosque import failed:', err);
      return reply.status(500).send({ error: err.message || 'Import failed' });
    }
  });

  app.post('/api/upload/tahfiz/bulk', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      const user = token ? verifyToken(token) : null;
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowed.includes(file.mimetype) && !file.filename.match(/\.(csv|xlsx|xls)$/i)) {
        return reply.status(400).send({ error: 'Only CSV and Excel files are accepted' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const result = await bulkImportTahfiz(buffer, Number(user.id));
      return reply.send(result);
    } catch (err: any) {
      console.error('Bulk tahfiz import failed:', err);
      return reply.status(500).send({ error: err.message || 'Import failed' });
    }
  });

  app.get('/api/file/:bucket/:filename', async (req, reply) => {
    const { filename, bucket } = req.params as { filename: string, bucket: string };

    try {
      const storage = getStorage();
      const stored = await findStoredFile(bucket, filename);

      const obj = await storage.getObject(bucket, filename);
      if (!obj) return reply.status(404).send({ error: 'File not found in bucket' });

      reply.header(
        "Content-Type",
        stored?.contentType ?? obj.contentType ?? "application/octet-stream",
      );
      return reply.send(obj.stream);
    } catch (err) {
      console.error('Failed to fetch file:', err);
      return reply.status(500).send({ error: 'Cannot get file from storage' });
    }
  });

};

