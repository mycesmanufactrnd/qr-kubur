import { Capacitor } from "@capacitor/core";

export function createPageUrl(pageName: string) {
  return "/" + pageName.toLowerCase().replace(/ /g, "-");
}

/**
 * Web: a relative path resolves against the same origin (reverse-proxied to
 * the backend). Native: the app bundles its own dist/ instead of loading
 * qubur.mycesgroup.com (so push notifications stay fully native), so there's
 * no same-origin backend to resolve against — prefix with the real backend's
 * absolute URL instead. Use this for every backend-relative URL (uploads,
 * file/image links, etc.) — never hardcode a bare "/api/..." path.
 */
export function apiUrl(path: string): string {
  const base = Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_API_BASE_URL ?? "")
    : "";
  return `${base}${path}`;
}

// export function resolveFileUrl(photourl: string | null | undefined, bucket: string) {
//     if (!photourl) return undefined;
//     if (/^https:\/\//i.test(photourl)) {
//         return `/api/proxy-image?url=${encodeURIComponent(photourl)}`;
//     }
//     return `/api/file/${bucket}/${encodeURIComponent(photourl)}`;
// }

export function resolveFileUrl(
  photourl: string | null | undefined,
  bucket: string,
) {
  if (!photourl) return undefined;

  if (
    /^https?:\/\//i.test(photourl) ||
    /^data:/i.test(photourl) ||
    /^blob:/i.test(photourl)
  ) {
    return photourl;
  }

  if (!bucket) return undefined;

  return apiUrl(`/api/file/${bucket}/${encodeURIComponent(photourl)}`);
}

export function appendCurrentUserToFormData(formData: FormData) {
  try {
    const raw = sessionStorage.getItem("appUserAuth");
    if (!raw) return;

    const user = JSON.parse(raw);
    const id = Number(user?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    const meta = {
      id,
      fullname: typeof user?.fullname === "string" ? user.fullname : null,
      organisationId: user?.organisation?.id
        ? Number(user.organisation.id)
        : null,
      tahfizcenterId: user?.tahfizcenter?.id
        ? Number(user.tahfizcenter.id)
        : null,
    };

    formData.append("currentUser", JSON.stringify(meta));
  } catch {
    // ignore
  }
}
