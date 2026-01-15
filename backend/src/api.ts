import { randomUUID } from 'crypto';
import type { FastifyInstance } from "fastify";
import { supabaseStorageClient } from "./supabase.ts";


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

