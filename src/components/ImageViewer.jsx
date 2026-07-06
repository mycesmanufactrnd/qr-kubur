// @ts-nocheck
import { resolveFileUrl } from "@/utils";
import { useEffect, useState } from "react";

const NO_IMAGE = "/no-image.svg";

export function ImageViewer({
  src,
  bucket,
  subBucket,
  alt = "Image",
  className = "",
  referrerPolicy = "no-referrer",
  placeholder,
}) {
  const [currentSrc, setCurrentSrc] = useState(
    () => resolveFileUrl(src, bucket) ?? NO_IMAGE,
  );

  useEffect(() => {
    setCurrentSrc(resolveFileUrl(src, bucket) ?? NO_IMAGE);
  }, [src, bucket]);

  const handleError = () => {
    if (subBucket && currentSrc === resolveFileUrl(src, bucket)) {
      setCurrentSrc(resolveFileUrl(src, subBucket) ?? NO_IMAGE);
      return;
    }

    if (placeholder && currentSrc !== placeholder) {
      setCurrentSrc(placeholder);
      return;
    }

    // Fallback if no image
    if (currentSrc !== NO_IMAGE) {
      setCurrentSrc(NO_IMAGE);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      referrerPolicy={currentSrc === NO_IMAGE ? undefined : referrerPolicy}
      onError={handleError}
    />
  );
}
