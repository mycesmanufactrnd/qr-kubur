import { useState } from "react";

export default function InitialAvatarImage({
  src,
  name,
  className = "",
}) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src || imgError) {
    return (
      <div className={`flex items-center justify-center bg-emerald-100 rounded-full ${className}`}>
        <span className="text-emerald-700 font-semibold text-sm">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`object-cover ${className}`}
    />
  );
}
