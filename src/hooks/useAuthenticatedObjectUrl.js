// @ts-nocheck
import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/utils";

// blob:/data: (local file picker previews) never need this — they're
// already loaded in memory. Everything else is a URL to our own
// /api/file/:bucket/:filename (relative on web, absolute via apiUrl() on
// native) that can 401 on a restricted bucket, so it's worth re-fetching
// with an Authorization header regardless of whether it's relative or
// absolute.
const needsAuthenticatedFetch = (src) =>
  typeof src === "string" && !/^(blob|data):/i.test(src);

// Mirrors the Authorization header react-pdf is given in FilePreviewDialog
// so plain <img> previews work the same way for restricted buckets
// (bucket-death-confirmation, bucket-police-report, etc.) that require a
// logged-in user and can't rely on a cross-origin cookie.
export function useAuthenticatedObjectUrl(src) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      setError(false);
      return;
    }

    if (!needsAuthenticatedFetch(src)) {
      setResolvedSrc(src);
      setError(false);
      return;
    }

    let objectUrl = null;
    let cancelled = false;
    setError(false);

    fetch(src, { credentials: "include", headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedSrc(null);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return { src: resolvedSrc, error };
}
