// @ts-nocheck
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronUp, ChevronDown, Users, X } from "lucide-react";
import { useAdminAccess } from "@/utils/auth";
import { trpc } from "@/utils/trpc";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";

export default function QariahRegistrationAlert() {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef(null);
  const { currentUser, hasAdminAccess } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;

  const { data } = trpc.deathCharityMember.getQariahPaginated.useQuery(
    {
      page: 1,
      pageSize: 500,
      filterOrganisationId: userOrgId || null,
      filterIsApproved: false,
    },
    { enabled: hasAdminAccess && !!currentUser },
  );

  const pendingItems = data?.items ?? [];

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (delta > 0) setTranslateX(delta);
  };

  const onTouchEnd = () => {
    if (translateX > 80) {
      setDismissed(true);
    } else {
      setTranslateX(0);
    }
    touchStartX.current = null;
  };

  if (pendingItems.length === 0 || dismissed) return null;

  return (
    <div
      className="w-80 shadow-2xl rounded-xl overflow-hidden border border-violet-300 transition-transform"
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: Math.max(0, 1 - translateX / 200),
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-violet-500 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">
            {pendingItems.length} {translate("Pending Qariah Registration(s)")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {collapsed ? (
            <ChevronUp className="w-4 h-4 text-white" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="ml-1 p-0.5 rounded hover:bg-violet-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="bg-white dark:bg-slate-800 max-h-64 overflow-y-auto">
          <p className="px-4 pt-3 pb-1 text-xs text-gray-500 dark:text-gray-400">
            {translate("Qariah members awaiting approval")}
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pendingItems.map((m) => (
              <Link
                key={m.id}
                to={`${createPageUrl("ManageQariahMember")}?fullname=${encodeURIComponent(m.fullname)}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <Users className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {m.fullname || translate("No Name")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {m.icnumber || "-"} &bull;{" "}
                    {new Date(m.createdat).toLocaleDateString("ms-MY")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
