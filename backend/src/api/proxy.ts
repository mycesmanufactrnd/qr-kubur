import https from "https";
import http from "http";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export const registerProxyRoutes = (app: FastifyInstance) => {
  app.get(
    "/api/proxy-image",
    (request: FastifyRequest, reply: FastifyReply) => {
      const { url } = request.query as { url?: string };

      if (!url) {
        return reply.status(400).send({ error: "Missing url" });
      }

      // Fastify already URL-decodes query params — just validate
      if (!/^https?:\/\//i.test(url)) {
        return reply.status(400).send({ error: "Invalid url" });
      }

      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return reply.status(400).send({ error: "Bad url" });
      }

      const lib = parsed.protocol === "https:" ? https : http;

      lib
        .get(
          url,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "image/*,*/*;q=0.8",
            },
            rejectUnauthorized: false, // allow self-signed / expired certs
          },
          (upstream) => {
            const status = upstream.statusCode ?? 0;
            console.log(`[proxy] ${status} ${url}`);

            if (status < 200 || status >= 300) {
              upstream.destroy();
              if (!reply.sent) {
                reply.status(502).send({ error: `Upstream ${status}` });
              }
              return;
            }

            const contentType =
              upstream.headers["content-type"] || "image/jpeg";
            reply.header("Content-Type", contentType);
            reply.header("Cache-Control", "public, max-age=86400");

            // Pipe the Node.js Readable stream directly — Fastify handles it natively
            reply.send(upstream);
          },
        )
        .on("error", (err) => {
          console.error(`[proxy] error for ${url}: ${err.message}`);
          if (!reply.sent) {
            reply.status(502).send({ error: err.message });
          }
        });
    },
  );
};
