export function createPageUrl(pageName: string) {
  return "/" + pageName.toLowerCase().replace(/ /g, "-");
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

  return `/api/file/${bucket}/${encodeURIComponent(photourl)}`;
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
