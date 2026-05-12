import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Hammer,
  ImageIcon,
  Heart,
} from "lucide-react";
import { createPageUrl, resolveFileUrl } from "@/utils";
import { openDirections, showEarthDistance } from "@/utils/helpers";
import { translate } from "@/utils/translations";
import { useState, useEffect } from "react";
import BannerImageWithFallback from "./BannerImageWithFallback";
import DonationButton from "./DonationButton";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
    icon: null,
  },
  full: {
    label: "Full",
    className: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border-rose-100 dark:border-rose-800",
    icon: null,
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-100 dark:border-amber-800",
    icon: <Hammer className="w-3 h-3 mr-1" />,
  },
};

export default function GraveCardList({ grave, onFavoriteChange }) {
  if (!grave) return null;

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(
      localStorage.getItem("favoritedgrave") || "[]",
    );
    const isAlreadyFavorited = favorites.some((fav) => fav.id === grave.id);
    setIsFavorited(isAlreadyFavorited);
  }, [grave.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(
      localStorage.getItem("favoritedgrave") || "[]",
    );

    if (isFavorited) {
      const updatedFavorites = favorites.filter((fav) => fav.id !== grave.id);
      localStorage.setItem("favoritedgrave", JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      const favGrave = {
        id: grave.id,
        name: grave.name,
      };

      favorites.push(favGrave);
      localStorage.setItem("favoritedgrave", JSON.stringify(favorites));
      setIsFavorited(true);
    }

    if (onFavoriteChange) onFavoriteChange();
  };

  const status = STATUS_CONFIG[grave.status?.toLowerCase()] || {
    label: grave.status,
    className: "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-600",
    icon: null,
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="relative h-36 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 overflow-hidden">
        <BannerImageWithFallback
          src={resolveFileUrl(grave.photourl, "bucket-grave")}
          alt={grave.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {grave.distance && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/20">
              <MapPin className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">
                {showEarthDistance(grave.distance)}
              </span>
            </div>
          )}
          <button
            onClick={toggleFavorite}
            className="w-8 h-8 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full transition-all active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isFavorited ? "fill-red-400 text-red-400" : "text-white"}`}
            />
          </button>
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 uppercase tracking-tight">
            {grave.name}
          </h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {grave.state}
          </p>
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-3.5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={`${status.className} text-xs font-medium px-2.5 py-0.5 border`}
          >
            {status.icon}
            {status.label}
          </Badge>

          {grave.totalgraves > 0 && (
            <Badge
              variant="outline"
              className="text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
            >
              {grave.totalgraves} {translate("Total Grave")}
            </Badge>
          )}
        </div>

        {grave.address && (
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{grave.address}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link
            to={createPageUrl(`GraveDetails?id=${grave.id}`)}
            className="flex-1"
          >
            <button
              className="w-full h-8 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-transparent text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors active:opacity-75"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {translate("Details") || "View Details"}
            </button>
          </Link>
          {grave.organisation && (
            <DonationButton
              recipientId={String(grave.organisation?.id)}
              recipientType={"organisation"}
              state={grave.state}
            />
          )}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDirections(grave.latitude, grave.longitude);
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
