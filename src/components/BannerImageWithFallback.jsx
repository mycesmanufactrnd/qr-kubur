import { Image } from "lucide-react";
import { useState } from "react";

export default function BannerImageWithFallback({ src, alt, className = "" }) {
  const [hasError, setHasError] = useState(false);

  const defaultFallback = (
    <div className="absolute inset-0 flex items-center justify-center">
      <Image className="w-12 h-12 text-white/20" />
    </div>
  );

  if (!src || hasError) {
    return defaultFallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
