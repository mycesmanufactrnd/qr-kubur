/**
 * Compresses an image before upload using createImageBitmap, which decodes
 * off the main thread (Chrome/Safari/Firefox) and avoids UI freezes.
 *
 * Strategy:
 *  1. Decode the full file off-thread → get natural dimensions → free immediately.
 *  2. Scale the decoded bitmap off-thread to target size → tiny result in RAM.
 *  3. Draw the tiny bitmap onto a small canvas on the main thread (fast).
 *  4. Encode to JPEG (fast because the canvas is small).
 *
 * maxDimension: 1920 — readable text in documents, identifiable defects in photos.
 * quality: 0.85 — safer for document/certificate text than 0.82; still much
 *   smaller than typical phone originals (35 MB → ~500 KB for a certificate).
 *
 * Falls back to the original file on any error, if compression produces a
 * larger file (e.g. already-optimised small images), or if the file isn't
 * a rasterizable image (e.g. PDFs, SVGs — passed through untouched).
 *
 * Note: if sideways phone images are reported, add `browser-image-compression`
 * which handles EXIF orientation in a Web Worker automatically.
 */
export const compressImage = async (
  file,
  { maxDimension = 1600, quality = 0.8 } = {},
) => {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml")
    return file;

  try {
    // --- Step 1: decode off-thread to get natural dimensions ---
    // imageOrientation:"from-image" applies EXIF rotation during decode (Chrome 81+,
    // Safari 15.4+). The bitmap's width/height already reflect the corrected orientation,
    // so all downstream math is correct. Firefox ignores this option silently.
    let full;

    try {
      full = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
    } catch {
      full = await createImageBitmap(file);
    }

    let { width, height } = full;

    // Compute target size (preserve aspect ratio)
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Skip re-encoding if already within bounds and already small
    if (width === full.width && height === full.height && file.size < 500_000) {
      full.close();
      return file;
    }

    // --- Step 2: scale the decoded bitmap off-thread ---
    // Avoids a second JPEG decode; operates on the already-decoded pixel data.
    let bitmap = full;
    try {
      const scaled = await createImageBitmap(full, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: "medium",
      });
      full.close(); // free the full-size bitmap (~800 MB for 200 MP) ASAP
      bitmap = scaled;
    } catch {
      // createImageBitmap resize from bitmap not supported — fall through.
      // main thread canvas drawImage will scale; may flicker for extreme sizes.
    }

    // --- Step 3: draw to small canvas (main thread, fast at target size) ---
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    bitmap.close();

    // --- Step 4: encode (fast because canvas is small) ---
    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          resolve(
            new File([blob], `${baseName}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            }),
          );
        },
        "image/jpeg",
        quality,
      );
    });
  } catch {
    return file; // any failure → upload original unchanged
  }
};
