export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function resolveFileUrl(photourl: string | null | undefined, bucket: string) {
    if (!photourl) return undefined;
    if (/^https?:\/\//i.test(photourl)) return photourl;
    return `/api/file/${bucket}/${encodeURIComponent(photourl)}`;
}

