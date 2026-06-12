// @ts-nocheck
import { useMemo, useState } from "react";
import { CreditCard, Edit3, KeyRound, Sparkles } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import PaymentConfigDialog from "@/components/PaymentConfigDialog";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { useAdminAccess } from "@/utils/auth";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { translate } from "@/utils/translations";

const maskValue = (value = "") => {
  if (!value) return "-";
  if (value.length <= 6) return "*".repeat(value.length);
  return `${"*".repeat(Math.max(3, value.length - 4))}${value.slice(-4)}`;
};

export default function MobileManagePaymentConfig() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const entity = useMemo(() => {
    if (currentUser?.tahfizcenter?.id) {
      return {
        entityId: Number(currentUser.tahfizcenter.id),
        entityType: "tahfiz",
        entityName: currentUser.tahfizcenter.name || "Tahfiz",
      };
    }
    if (currentUser?.organisation?.id) {
      return {
        entityId: Number(currentUser.organisation.id),
        entityType: "organisation",
        entityName: currentUser.organisation.name || "Organisation",
      };
    }
    return { entityId: null, entityType: null, entityName: null };
  }, [currentUser]);

  const { data: existingConfigs = [], isLoading } = useGetConfigByEntity({
    entityId: entity.entityId || undefined,
    entityType: entity.entityType || undefined,
    enabled: !!entity.entityId && !!entity.entityType,
  });

  const groupedConfigs = useMemo(() => {
    const grouped = {};
    for (const config of existingConfigs) {
      const platformName = config.paymentplatform?.name || translate("Unknown Platform");
      if (!grouped[platformName]) grouped[platformName] = [];
      grouped[platformName].push(config);
    }
    return Object.entries(grouped);
  }, [existingConfigs]);

  if (loadingUser || isLoading) return <PageLoadingComponent />;

  if (!hasAdminAccess) return <AccessDeniedComponent isPage/>;

  if (!entity.entityId || !entity.entityType)
    return <NoDataCardComponent isPage />;

  return (
    <div className="min-h-screen pb-6 dark:bg-slate-900">
      <BackNavigation title={translate("Payment Config")} />

      <div className="max-w-2xl mx-auto px-3 space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {entity.entityName}
          </p>
        </div>
        <div className="flex items-center pt-1">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-purple-600 text-white text-sm font-semibold active:opacity-80 transition-opacity shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {translate("Update Config")}
          </button>
        </div>

        {groupedConfigs.length === 0 ? (
          <NoDataCardComponent />
        ) : (
          groupedConfigs.map(([platformName, configs]) => (
            <div
              key={platformName}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-slate-100 dark:border-slate-700">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {platformName}
                </p>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {configs.map((config) => {
                  const isSecret =
                    config.paymentfield?.fieldtype === "password";
                  return (
                    <div key={config.id} className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-1">
                        <KeyRound className="w-3 h-3" />
                        {config.paymentfield?.label ||
                          config.paymentfield?.key ||
                          "-"}
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 break-all">
                        {isSecret ? maskValue(config.value) : config.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <PaymentConfigDialog
        open={isDialogOpen}
        hasAdminAccess={hasAdminAccess}
        onOpenChange={setIsDialogOpen}
        entityId={entity.entityId}
        entityType={entity.entityType}
      />
    </div>
  );
}
