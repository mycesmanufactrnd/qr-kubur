import { randomUUID } from 'crypto';
import type { FastifyInstance } from "fastify";
import { supabaseStorageClient } from "../supabase.ts";
import { verifyToken } from "../auth.ts";
import { bulkImportGraves } from "../services/upload.service.ts";


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

      const safeName = `${randomUUID()}-${filename}`;

      console.log('New name:', safeName);

      const { data, error } = await supabaseStorageClient.storage
        .from(bucket!)
        .upload(safeName, buffer, { contentType: mimetype, upsert: false });

      if (error) {
        console.error("Supabase upload error:", error);
        return reply.status(500).send({ error: error.message || 'Upload failed' });
      }

      return reply.send({ file_url: safeName });
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
      const { data, error } = await supabaseStorageClient
        .storage
        .from(bucket)
        .download(filename);

      if (error || !data) {
        return reply.status(404).send({ error: 'File not found in bucket' });
      }

      const contentType = data.type || 'application/octet-stream';

      const arrayBuffer = await data.arrayBuffer();
      reply.header('Content-Type', contentType);
      return reply.send(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Failed to fetch file:', err);
      return reply.status(500).send({ error: 'Cannot get file from storage' });
    }
  });

};

