import { useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Building2, Cross, BookOpen, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";
import { useGetTahfizCoordinates } from "@/hooks/useTahfizMutations";
import { useGetGravesCoordinates } from "@/hooks/useGraveMutations";
import { useGetMosqueCoordinates } from "@/hooks/useMosqueMutations";
import { categoryIcon } from "@/components/map/categoryIcon";
import { useLocationContext } from "@/providers/LocationProvider";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import { STATES_MY } from "@/utils/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/utils/translations";
import { createPageUrl } from "@/utils";
import BackNavigation from "@/components/BackNavigation";
import DirectionButton from "@/components/DirectionButton";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_ZOOM = 11;

export default function MapView() {
  const { userLocation, userState, locationDenied, isLocationLoading } =
    useLocationContext();

  const [selectedState, setSelectedState] = useState(null); // null = follow userState
  const [visible, setVisible] = useState({
    mosque: true,
    grave: true,
    tahfiz: true,
  });

  const activeState = selectedState ?? userState;
  const coords = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : null;
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [4.2105, 108.9758];
  const stateFilter = activeState ? { state: activeState } : {};

  const { data: allMosques = [], isLoading: loadingMosques } =
    useGetMosqueCoordinates(coords, stateFilter);

  const { data: allGraves = [], isLoading: loadingGraves } =
    useGetGravesCoordinates(coords, stateFilter);

  const { data: allTahfiz = [], isLoading: loadingTahfiz } =
    useGetTahfizCoordinates({ coordinates: coords, filterState: activeState });

  const loading = loadingMosques || loadingGraves || loadingTahfiz;

  const visibleMosques = visible.mosque ? allMosques : [];
  const visibleGraves = visible.grave ? allGraves : [];
  const visibleTahfiz = visible.tahfiz ? allTahfiz : [];
  const totalVisible =
    visibleMosques.length + visibleGraves.length + visibleTahfiz.length;

  const toggleCategory = (cat) => setVisible((v) => ({ ...v, [cat]: !v[cat] }));

  if (isLocationLoading) return <PageLoadingComponent />;
  if (locationDenied) return <NoDataCardComponent isPage isNoGPS />;

  return (
    <div className="flex flex-col">
      <BackNavigation title={translate("Map View")} />
      <div className="relative z-[1000] flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toggleCategory("mosque")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              visible.mosque
                ? "bg-green-100 border-green-400 text-green-800"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Masjid ({visibleMosques.length})
          </button>
          <button
            onClick={() => toggleCategory("grave")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              visible.grave
                ? "bg-slate-200 border-slate-400 text-slate-800"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <Cross className="w-3.5 h-3.5" />
            Kubur ({visibleGraves.length})
          </button>
          <button
            onClick={() => toggleCategory("tahfiz")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              visible.tahfiz
                ? "bg-blue-100 border-blue-400 text-blue-800"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Tahfiz ({visibleTahfiz.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedState ?? activeState ?? "all"}
            onValueChange={(v) => setSelectedState(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-36 h-7 text-xs">
              <SelectValue placeholder="Pilih Negeri" />
            </SelectTrigger>
            <SelectContent className="z-[2000]">
              {STATES_MY.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {totalVisible} penanda
          </span>
        </div>
      </div>

      <div style={{ height: "calc(100dvh - 230px)", overflow: "hidden" }}>
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
          />

          {visible.mosque && (
            <MarkerClusterGroup chunkedLoading>
              {visibleMosques
                .filter(
                  (mosque) =>
                    !isNaN(parseFloat(mosque.latitude)) &&
                    !isNaN(parseFloat(mosque.longitude)),
                )
                .map((mosque) => (
                  <Marker
                    key={mosque.id}
                    position={[parseFloat(mosque.latitude), parseFloat(mosque.longitude)]}
                    icon={categoryIcon.mosque}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-0.5">
                        {mosque.photourl && (
                          <img
                            src={mosque.photourl}
                            alt={mosque.name}
                            className="w-full h-24 object-cover rounded mb-1"
                          />
                        )}
                        <p className="font-semibold text-sm">{mosque.name}</p>
                        {mosque.organisation?.name && (
                          <p className="text-xs text-emerald-700">{mosque.organisation.name}</p>
                        )}
                        {mosque.address && (
                          <p className="text-xs text-gray-500">{mosque.address}</p>
                        )}
                        {mosque.state && (
                          <p className="text-xs text-gray-400">{mosque.state}</p>
                        )}
                        {mosque.latitude && mosque.longitude && (
                          <div className="pt-1">
                            <DirectionButton
                              addClass="flex-1"
                              latitude={mosque.latitude}
                              longitude={mosque.longitude}
                            />
                          </div>
                        )}
                        <Link
                          to={`${createPageUrl("MosqueDetailsPage")}?id=${mosque.id}`}
                          className="block pt-1 text-xs font-medium text-emerald-600 hover:underline"
                        >
                          Lihat Butiran →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}

          {visible.grave && (
            <MarkerClusterGroup chunkedLoading>
              {visibleGraves
                .filter(
                  (grave) =>
                    !isNaN(parseFloat(grave.latitude)) &&
                    !isNaN(parseFloat(grave.longitude)),
                )
                .map((grave) => (
                  <Marker
                    key={grave.id}
                    position={[
                      parseFloat(grave.latitude),
                      parseFloat(grave.longitude),
                    ]}
                    icon={categoryIcon.grave}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-0.5">
                        {grave.photourl && (
                          <img
                            src={grave.photourl}
                            alt={grave.name}
                            className="w-full h-24 object-cover rounded mb-1"
                          />
                        )}
                        <p className="font-semibold text-sm">{grave.name}</p>
                        {grave.organisation?.name && (
                          <p className="text-xs text-slate-600">{grave.organisation.name}</p>
                        )}
                        {grave.address && (
                          <p className="text-xs text-gray-500">{grave.address}</p>
                        )}
                        {grave.state && (
                          <p className="text-xs text-gray-400">{grave.state}</p>
                        )}
                        {grave.latitude && grave.longitude && (
                          <div className="pt-1">
                            <DirectionButton
                              addClass="flex-1"
                              latitude={grave.latitude}
                              longitude={grave.longitude}
                            />
                          </div>
                        )}
                        <Link
                          to={`${createPageUrl("GraveDetails")}?id=${grave.id}`}
                          className="block pt-1 text-xs font-medium text-slate-600 hover:underline"
                        >
                          Lihat Butiran →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}

          {visible.tahfiz && (
            <MarkerClusterGroup chunkedLoading>
              {visibleTahfiz
                .filter(
                  (tahfiz) =>
                    !isNaN(parseFloat(tahfiz.latitude)) &&
                    !isNaN(parseFloat(tahfiz.longitude)),
                )
                .map((tahfiz) => (
                  <Marker
                    key={tahfiz.id}
                    position={[
                      parseFloat(tahfiz.latitude),
                      parseFloat(tahfiz.longitude),
                    ]}
                    icon={categoryIcon.tahfiz}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        {tahfiz.photourl && (
                          <img
                            src={tahfiz.photourl}
                            alt={tahfiz.name}
                            className="w-full h-28 object-cover rounded mb-2"
                          />
                        )}
                        <p className="font-semibold text-sm">{tahfiz.name}</p>
                        {tahfiz.address && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tahfiz.address}
                          </p>
                        )}
                        {tahfiz.state && (
                          <p className="text-xs text-gray-400">
                            {tahfiz.state}
                          </p>
                        )}
                        {tahfiz.phone && (
                          <p className="text-xs text-gray-500">
                            {tahfiz.phone}
                          </p>
                        )}
                        {tahfiz.latitude && tahfiz.longitude && (
                          <div className="pt-1">
                            <DirectionButton
                              addClass="flex-1"
                              latitude={tahfiz.latitude}
                              longitude={tahfiz.longitude}
                            />
                          </div>
                        )}
                        <Link
                          to={`${createPageUrl("TahfizDetails")}?id=${tahfiz.id}`}
                          className="block pt-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          Lihat Butiran →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
