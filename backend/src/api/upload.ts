import { randomUUID } from 'crypto';
import type { FastifyInstance } from "fastify";
import path from "path";
import { verifyToken } from "../auth.ts";
import { bulkImportGraves } from "../services/upload.service.ts";
import { getStorage } from "../storage/storage.ts";
import { createStoredFile, findStoredFile } from "../services/storageMetadata.service.ts";


export const registerUploadRoutes = (app: FastifyInstance) => {
  app.post('/api/upload/:bucket', async (request, reply) => {
    try {
      const { bucket } = request.params as { bucket: string };

      const file = await request.file();

      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      const { filename, mimetype, file: fileStream } = file;

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);

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

      const stored = await createStoredFile({
        bucket: result.bucket,
        key: result.key,
        originalName: filename,
        contentType: result.contentType ?? null,
        sizeBytes: result.sizeBytes,
        uploadedById: (request as any).user?.id ? Number((request as any).user.id) : null,
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

