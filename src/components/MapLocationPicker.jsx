// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16);
  }, [target, map]);
  return null;
}

function ClickAndDragMarker({ position, onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onMove(lat, lng);
        },
      }}
    />
  );
}

export default function MapLocationPicker({ lat, lng, onChange, placeholder = "Search location..." }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const position =
    lat != null && lng != null && lat !== "" && lng !== ""
      ? [parseFloat(lat), parseFloat(lng)]
      : null;

  const initialCenter = position ?? [4.2105, 101.9758];

  // Recompute dropdown position whenever it becomes visible or suggestions change
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [showDropdown, suggestions.length]);

  // Debounced fetch
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (item) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setQuery(item.display_name);
    setSuggestions([]);
    setShowDropdown(false);
    onChange(newLat, newLng);
    setFlyTarget([newLat, newLng]);
  };

  return (
    <div className="space-y-2">
      {/* Search with autocomplete */}
      <div ref={containerRef} className="relative">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="pr-8 dark:border-slate-600"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Dropdown — fixed so it's never clipped by overflow-hidden/auto parents */}
        {showDropdown && (
          <ul
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((item) => (
              <li
                key={item.place_id}
                onMouseDown={() => selectSuggestion(item)}
                className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="line-clamp-2 text-slate-700 dark:text-slate-200">
                  {item.display_name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border dark:border-slate-600" style={{ height: 300 }}>
        <MapContainer
          center={initialCenter}
          zoom={position ? 15 : 10}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo target={flyTarget} />
          <ClickAndDragMarker position={position} onMove={onChange} />
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Search, click on the map, or drag the marker to set the location.
      </p>
    </div>
  );
}
