// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const CACHE_NAME = "qubur-offline-v1";

export function useOfflineFile(url) {
  const [status, setStatus] = useState("checking"); // checking | idle | downloading | cached | error
  const [progress, setProgress] = useState(0);
  const [objectUrl, setObjectUrl] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!url || !("caches" in window)) { setStatus("idle"); return; }

    let cancelled = false;
    caches.open(CACHE_NAME).then(async (cache) => {
      const match = await cache.match(url);
      if (cancelled) return;
      if (match) {
        const blob = await match.blob();
        if (cancelled) return;
        const oUrl = URL.createObjectURL(blob);
        blobUrlRef.current = oUrl;
        setObjectUrl(oUrl);
        setStatus("cached");
      } else {
        setStatus("idle");
      }
    }).catch(() => { if (!cancelled) setStatus("idle"); });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url]);

  const download = async () => {
    if (!("caches" in window)) return;
    setStatus("downloading");
    setProgress(0);
    try {
      const resp = await fetch(url, { mode: "cors" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const total = Number(resp.headers.get("content-length")) || null;
      const reader = resp.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) setProgress(Math.min(99, Math.round((received / total) * 100)));
      }

      const blob = new Blob(chunks, { type: "application/pdf" });
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(blob, { headers: { "Content-Type": "application/pdf" } }));

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const oUrl = URL.createObjectURL(blob);
      blobUrlRef.current = oUrl;
      setObjectUrl(oUrl);
      setProgress(100);
      setStatus("cached");
    } catch {
      setStatus("error");
    }
  };

  return { status, progress, objectUrl, download };
}
