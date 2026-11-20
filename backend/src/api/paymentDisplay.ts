import type { FastifyInstance } from 'fastify';
import { AppDataSource } from '../datasource.js';
import { OrganisationPaymentConfig, TahfizPaymentConfig } from '../db/entities.js';
import { publicPaymentMethods, storedQrKey } from '../services/publicPaymentDisplay.js';
import { getStorage } from '../storage/storage.js';
import { findStoredFile } from '../services/storageMetadata.service.js';

async function loadConfigs(type: string, id: number): Promise<any[]> {
  const relations = ['paymentplatform', 'paymentplatform.paymentfields', 'paymentfield'];
  return type === 'organisation'
    ? AppDataSource.getRepository(OrganisationPaymentConfig).find({ where: { organisation: { id } }, relations })
    : AppDataSource.getRepository(TahfizPaymentConfig).find({ where: { tahfizcenter: { id } }, relations });
}

export function registerPaymentDisplayRoutes(app: FastifyInstance) {
  // Read-only routes: displaying/sharing a QR never creates or updates a payment.
  for (const image of [false, true]) {
    app.get(`/api/payment-display/:type/:id${image ? '/qr/:configId' : ''}`, async (request, reply) => {
      const { type, id: rawId, configId } = request.params as { type: string; id: string; configId?: string };
      const id = Number(rawId);
      if (!['organisation', 'tahfiz'].includes(type) || !Number.isSafeInteger(id) || id <= 0) return reply.code(400).send({ error: 'Invalid recipient' });
      const configs = await loadConfigs(type, id);
      const methods = publicPaymentMethods(configs, type, id);
      reply.header('Cache-Control', 'no-store');
      if (!image) return methods;
      const target = `/api/payment-display/${type}/${id}/qr/${configId}`;
      if (!methods.some(m => m.qrUrl === target)) return reply.code(404).send({ error: 'QR unavailable' });
      const config = configs.find(c => c.id === Number(configId));
      const key = storedQrKey(config?.value);
      if (!key) return reply.code(404).send({ error: 'QR unavailable' });
      const bucket = type === 'organisation' ? 'bucket-organisation-config' : 'bucket-tahfiz-config';
      const obj = await getStorage().getObject(bucket, key);
      if (!obj) return reply.code(404).send({ error: 'QR unavailable' });
      const metadata = await findStoredFile(bucket, key);
      const extension = key.split('.').pop()?.toLowerCase() ?? '';
      const legacyImageTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
      const mime = metadata?.contentType ?? obj.contentType ?? legacyImageTypes[extension];
      if (!mime || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mime)) return reply.code(404).send({ error: 'QR unavailable' });
      reply.header('Content-Type', mime).header('X-Content-Type-Options', 'nosniff');
      return reply.send(obj.stream);
    });
  }
}
