// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const CACHE_NAME = "qubur-pdf-cache-v1";

// Silently serves a PDF from the Cache Storage API when available, and
// fetches + caches it in the background otherwise, so repeat visits load
// instantly without any user-facing "download" step (content is static).
export function usePdfCache(url) {
  const [objectUrl, setObjectUrl] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!url || !("caches" in window)) return;

    let cancelled = false;

    const useBlob = (blob) => {
      if (cancelled) return;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const oUrl = URL.createObjectURL(blob);
      blobUrlRef.current = oUrl;
      setObjectUrl(oUrl);
    };

    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const match = await cache.match(url);
        if (match) {
          useBlob(await match.blob());
          return;
        }

        const resp = await fetch(url);
        if (!resp.ok || cancelled) return;
        await cache.put(url, resp.clone());
        useBlob(await resp.blob());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url]);

  return { objectUrl };
}
