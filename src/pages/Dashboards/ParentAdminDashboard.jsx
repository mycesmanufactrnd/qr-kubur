// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Building2,
  Landmark,
  MapPin,
  Users,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import { categoryIcon } from "@/components/map/categoryIcon";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetParentOverview,
  useIsParentOrganisation,
} from "@/mutations/useDashboardMutations";
import { createPageUrl } from "@/utils";
import { formatRM } from "@/utils/helpers";
import { MONTHS_SHORT } from "@/utils/enums";
import { translate } from "@/utils/translations";

const MALAYSIA_CENTER = [4.2105, 101.9758];
const ALL_STATES = "all";

const LAYERS = [
  { key: "organisations", label: "Organisations", icon: categoryIcon.organisation, dot: "bg-violet-500" },
  { key: "mosques", label: "Mosques", icon: categoryIcon.mosque, dot: "bg-emerald-500" },
  { key: "graves", label: "Graves", icon: categoryIcon.grave, dot: "bg-slate-400" },
];

const hasCoordinates = (p) => p.latitude != null && p.longitude != null;

function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [points, map]);
  return null;
}

function SectionCard({ title, dotClass = "bg-emerald-500", action, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          {title}
        </h3>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-emerald-200" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-emerald-100/80 truncate">{label}</p>
        <p className="text-2xl font-bold font-mono text-white leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-emerald-200/70 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function RankedBars({ rows, valueSuffix, barClass, emptyText }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length || total === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">{emptyText}</p>;
  }
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 truncate text-right" title={r.name}>
            {r.name}
          </p>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 h-3.5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={`h-full rounded ${barClass}`} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {r.value.toLocaleString()} {valueSuffix} · {Math.round((r.value / total) * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownRow({ label, value, total, barClass }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
          {value.toLocaleString()} <span className="text-xs font-normal text-slate-400">· {pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Footnote({ children }) {
  return (
    <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}

export default function ParentAdminDashboard() {
  const { currentUser, loadingUser, hasAdminAccess } = useAdminAccess();
  const hasOrganisation = !!currentUser?.organisation?.id;
  const { isParentOrganisation, isLoading: parentLoading } =
    useIsParentOrganisation(hasOrganisation);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [stateFilter, setStateFilter] = useState(ALL_STATES);
  const [visibleLayers, setVisibleLayers] = useState({
    organisations: true,
    mosques: true,
    graves: true,
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, isFetching, refetch } = useGetParentOverview({
    year,
    enabled: hasOrganisation && isParentOrganisation,
  });

  const mapPoints = useMemo(() => {
    if (!data) return { organisations: [], mosques: [], graves: [] };
    const inState = (state) => stateFilter === ALL_STATES || state === stateFilter;
    return {
      organisations: data.organisations.filter(
        (o) =>
          hasCoordinates(o) &&
          (stateFilter === ALL_STATES || (o.states ?? []).includes(stateFilter)),
      ),
      mosques: data.mosques.filter((m) => hasCoordinates(m) && inState(m.state)),
      graves: data.graves.filter((g) => hasCoordinates(g) && inState(g.state)),
    };
  }, [data, stateFilter]);

  const fitPoints = useMemo(
    () => [...mapPoints.organisations, ...mapPoints.mosques, ...mapPoints.graves],
    [mapPoints],
  );

  const organisationNameById = useMemo(
    () => new Map((data?.organisations ?? []).map((o) => [o.id, o.name])),
    [data],
  );

  const stateOptions = useMemo(
    () => (data?.states ?? []).map((s) => s.state).sort(),
    [data],
  );

  const chartData = useMemo(
    () =>
      (data?.monthly ?? []).map((m) => ({
        name: translate(MONTHS_SHORT[m.month - 1]),
        arwah: m.arwah,
        arwahPrev: m.arwahPrev,
        jenazah: m.jenazah,
        jenazahPrev: m.jenazahPrev,
      })),
    [data],
  );

  if (loadingUser || (hasOrganisation && parentLoading)) {
    return <PageLoadingComponent />;
  }
  if (!hasAdminAccess || !hasOrganisation) {
    return <AccessDeniedComponent isPage />;
  }
  if (!isParentOrganisation) {
    return <Navigate to={createPageUrl("AdminDashboard")} replace />;
  }

  const totals = data?.totals;
  const rootOrganisation = data?.organisations.find((o) => o.isRoot);
  const mapPointsWithCoordinates =
    (data?.organisations.filter(hasCoordinates).length ?? 0) +
    (data?.mosques.filter(hasCoordinates).length ?? 0) +
    (data?.graves.filter(hasCoordinates).length ?? 0);
  const mapPointsTotal =
    (data?.organisations.length ?? 0) +
    (data?.mosques.length ?? 0) +
    (data?.graves.length ?? 0);

  const fmt = (n) => (isLoading || n == null ? "—" : Number(n).toLocaleString());

  const topMosques = (data?.topMosquesByJenazah ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    value: m.count,
  }));
  const topOrganisations = [...(data?.organisations ?? [])]
    .sort((a, b) => b.arwahCount - a.arwahCount)
    .slice(0, 5)
    .map((o) => ({ id: o.id, name: o.name, value: o.arwahCount }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 truncate">
                  {rootOrganisation?.name ?? currentUser?.organisation?.name}
                </p>
                <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                  {translate("Management Overview")}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden md:inline font-mono text-sm text-emerald-100/90 mr-1">
                {now.toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-9 w-[96px] bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                title={translate("Refresh")}
                aria-label={translate("Refresh")}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              </button>
              <Link
                to={createPageUrl("AdminDashboard")}
                className="h-9 px-3 flex items-center gap-2 rounded-lg bg-emerald-400 text-emerald-950 text-sm font-semibold hover:bg-emerald-300"
              >
                <LayoutDashboard className="w-4 h-4" />
                {translate("Admin Dashboard")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 border-t border-white/10 divide-white/10 xl:divide-x">
            <KpiTile
              icon={Building2}
              label={translate("Organisations")}
              value={fmt(totals?.organisations)}
              sub={translate("Including child organisations")}
            />
            <KpiTile icon={Landmark} label={translate("Mosques")} value={fmt(totals?.mosques)} />
            <KpiTile icon={MapPin} label={translate("Graves")} value={fmt(totals?.graves)} />
            <KpiTile
              icon={Users}
              label={translate("Arwah")}
              value={fmt(totals?.arwah)}
              sub={`${year}: ${fmt(totals?.arwahThisYear)}`}
            />
            <KpiTile
              icon={ClipboardList}
              label={translate("Jenazah Cases")}
              value={fmt(totals?.jenazah?.total)}
              sub={`${fmt(totals?.jenazah?.pending)} ${translate("pending")}`}
            />
            <KpiTile
              icon={HeartHandshake}
              label={translate("Kariah Members")}
              value={fmt(totals?.kariah?.total)}
              sub={`${fmt(totals?.kariah?.pending)} ${translate("awaiting approval")}`}
            />
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <SectionCard
            className="xl:col-span-7"
            title={translate("Locations Map")}
            action={
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  <SelectItem value={ALL_STATES}>{translate("All States")}</SelectItem>
                  {stateOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  onClick={() =>
                    setVisibleLayers((prev) => ({ ...prev, [layer.key]: !prev[layer.key] }))
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    visibleLayers[layer.key]
                      ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${layer.dot}`} />
                  {translate(layer.label)}
                  <span className="font-mono">{mapPoints[layer.key].length}</span>
                </button>
              ))}
            </div>
            <div className="h-[360px] lg:h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
              <MapContainer center={MALAYSIA_CENTER} zoom={6} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  crossOrigin="anonymous"
                />
                <FitToPoints points={fitPoints} />
                <MarkerClusterGroup chunkedLoading>
                  {LAYERS.filter((layer) => visibleLayers[layer.key]).flatMap((layer) =>
                    mapPoints[layer.key].map((point) => (
                      <Marker
                        key={`${layer.key}-${point.id}`}
                        position={[point.latitude, point.longitude]}
                        icon={layer.icon}
                      >
                        <Popup>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {translate(layer.label)}
                            </p>
                            <p className="font-semibold text-slate-800">{point.name}</p>
                            {layer.key === "organisations" ? (
                              <p className="text-xs text-slate-500">
                                {translate("Mosques")}: {point.mosqueCount} · {translate("Graves")}:{" "}
                                {point.graveCount} · {translate("Arwah")}: {point.arwahCount}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500">
                                {[point.state, organisationNameById.get(point.organisationId)]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )),
                  )}
                </MarkerClusterGroup>
              </MapContainer>
            </div>
            {!isLoading && mapPointsWithCoordinates < mapPointsTotal && (
              <Footnote>
                {mapPointsTotal - mapPointsWithCoordinates}{" "}
                {translate("locations have no coordinates and are not shown on the map.")}
              </Footnote>
            )}
          </SectionCard>

          <div className="xl:col-span-5 flex flex-col gap-5">
            <SectionCard title={`${translate("Arwah & Jenazah Cases")} — ${year} vs ${year - 1}`}>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="arwah" name={`${translate("Arwah")} ${year}`} stroke="#059669" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="arwahPrev" name={`${translate("Arwah")} ${year - 1}`} stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                    <Line type="monotone" dataKey="jenazah" name={`${translate("Jenazah Cases")} ${year}`} stroke="#0e7490" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="jenazahPrev" name={`${translate("Jenazah Cases")} ${year - 1}`} stroke="#67e8f9" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
              <SectionCard title={translate("Top 5 Mosques by Jenazah Cases")}>
                <RankedBars
                  rows={topMosques}
                  barClass="bg-gradient-to-r from-cyan-300 to-cyan-600"
                  emptyText={translate("No jenazah cases yet")}
                />
              </SectionCard>
              <SectionCard title={translate("Top 5 Organisations by Arwah")}>
                <RankedBars
                  rows={topOrganisations}
                  barClass="bg-gradient-to-r from-emerald-200 to-emerald-600"
                  emptyText={translate("No arwah recorded yet")}
                />
              </SectionCard>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <SectionCard title={translate("Jenazah Case Status")} dotClass="bg-cyan-500">
            <div className="space-y-4">
              <BreakdownRow label={translate("Pending")} value={totals?.jenazah?.pending ?? 0} total={totals?.jenazah?.total} barClass="bg-amber-400" />
              <BreakdownRow label={translate("Ongoing")} value={totals?.jenazah?.ongoing ?? 0} total={totals?.jenazah?.total} barClass="bg-emerald-500" />
              <BreakdownRow label={translate("Closed")} value={totals?.jenazah?.closed ?? 0} total={totals?.jenazah?.total} barClass="bg-blue-500" />
              <BreakdownRow label={translate("Rejected")} value={totals?.jenazah?.rejected ?? 0} total={totals?.jenazah?.total} barClass="bg-rose-500" />
            </div>
            <Footnote>
              {year}: {fmt(totals?.jenazahThisYear)} {translate("cases received")}
            </Footnote>
          </SectionCard>

          <SectionCard title={translate("Kariah Membership")} dotClass="bg-violet-500">
            <div className="space-y-4">
              <BreakdownRow label={translate("Approved")} value={totals?.kariah?.approved ?? 0} total={totals?.kariah?.total} barClass="bg-emerald-500" />
              <BreakdownRow label={translate("Pending Approval")} value={totals?.kariah?.pending ?? 0} total={totals?.kariah?.total} barClass="bg-amber-400" />
              <BreakdownRow label={translate("Deceased")} value={totals?.kariah?.deceased ?? 0} total={totals?.kariah?.total} barClass="bg-slate-400" />
            </div>
            <Footnote>
              {fmt(totals?.notifications)} {translate("death notifications sent to kariah members.")}
            </Footnote>
          </SectionCard>

          <SectionCard title={translate("Khairat Kematian")} dotClass="bg-amber-500">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { label: translate("Khairat Schemes"), value: fmt(totals?.khairat?.schemes) },
                { label: translate("Khairat Members"), value: fmt(totals?.khairat?.members) },
                {
                  label: translate("Total Paid Out"),
                  value: isLoading ? "—" : formatRM(totals?.khairat?.payout ?? 0),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 first:pt-0">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <Footnote>{translate("Payout counts claims with Paid status only.")}</Footnote>
          </SectionCard>

          <SectionCard title={translate("Top States")} dotClass="bg-orange-500">
            {(data?.states ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{translate("No data yet")}</p>
            ) : (
              <ol className="space-y-2.5">
                {data.states.slice(0, 5).map((s, i) => (
                  <li key={s.state} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-xs text-slate-400">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-200 truncate">{s.state}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.mosques} {translate("mosques")} · {s.graves} {translate("graves")}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{s.arwah.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.jenazah} {translate("cases")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <Footnote>{translate("Ranked by arwah plus jenazah cases.")}</Footnote>
          </SectionCard>
        </div>

        <SectionCard title={translate("Organisation Breakdown")} dotClass="bg-violet-500">
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left font-semibold px-5 py-3">{translate("Organisation")}</th>
                  <th className="text-right font-semibold px-3 py-3">{translate("Mosques")}</th>
                  <th className="text-right font-semibold px-3 py-3">{translate("Graves")}</th>
                  <th className="text-right font-semibold px-3 py-3">{translate("Arwah")}</th>
                  <th className="text-right font-semibold px-3 py-3">{translate("Jenazah Cases")}</th>
                  <th className="text-right font-semibold px-5 py-3">{translate("Kariah Members")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.organisations ?? []).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">
                      <span className="font-medium">{o.name}</span>
                      {o.isRoot && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {translate("Parent")}
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono px-3 py-3">{o.mosqueCount}</td>
                    <td className="text-right font-mono px-3 py-3">{o.graveCount}</td>
                    <td className="text-right font-mono px-3 py-3">{o.arwahCount}</td>
                    <td className="text-right font-mono px-3 py-3">{o.jenazahCount}</td>
                    <td className="text-right font-mono px-5 py-3">{o.kariahCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
