import { useMemo, useState } from "react";
import { CreditCard, Edit3, KeyRound, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import PaymentConfigDialog from "@/components/PaymentConfigDialog";
import { useAdminAccess } from "@/utils/auth";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { translate } from "@/utils/translations";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import Breadcrumb from "@/components/Breadcrumb";

const maskValue = (value = "") => {
  if (!value) return "-";
  if (value.length <= 6) return "*".repeat(value.length);
  return `${"*".repeat(Math.max(3, value.length - 4))}${value.slice(-4)}`;
};

export default function MyPaymentConfig() {
  const { loadingUser, hasAdminAccess, currentUser, isTahfizAdmin } =
    useAdminAccess();
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

    return {
      entityId: null,
      entityType: null,
      entityName: null,
    };
  }, [currentUser]);

  const { data: existingConfigs = [], isLoading } = useGetConfigByEntity({
    entityId: entity.entityId || undefined,
    entityType: entity.entityType || undefined,
    enabled: !!entity.entityId && !!entity.entityType,
  });

  const groupedConfigs = useMemo(() => {
    const grouped = {};

    for (const config of existingConfigs) {
      const platformName = config.paymentplatform?.name || "Unknown Platform";
      if (!grouped[platformName]) grouped[platformName] = [];
      grouped[platformName].push(config);
    }

    return Object.entries(grouped);
  }, [existingConfigs]);

  if (loadingUser || isLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  if (!entity.entityId || !entity.entityType) {
    return <NoDataCardComponent isPage />;
  }

  const dashboardLabel = isTahfizAdmin
    ? translate("Tahfiz Dashboard")
    : translate("Admin Dashboard");
  const dashboardPage = isTahfizAdmin ? "TahfizDashboard" : "AdminDashboard";

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: dashboardLabel, page: dashboardPage },
          { label: translate("Payment Config"), page: "MyPaymentConfig" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-purple-600" />
            {translate("My Payment Configuration")}
          </h1>
          <p className="text-slate-600 text-sm mt-1">{entity.entityName}</p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          {translate("Update Config")}
        </Button>
      </div>

      {groupedConfigs.length === 0 ? (
        <NoDataCardComponent isPage />
      ) : (
        <div>
          {groupedConfigs.map(([platformName, configs]) => (
            <Card key={platformName} className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100">
                <CardTitle className="text-slate-800 flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {platformName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {configs.map((config) => {
                  const isSecret =
                    config.paymentfield?.fieldtype === "password";
                  return (
                    <div
                      key={config.id}
                      className="rounded-lg border border-slate-100 p-3 bg-white"
                    >
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        {config.paymentfield?.label ||
                          config.paymentfield?.key ||
                          "-"}
                      </p>
                      <p className="text-sm font-medium text-slate-700 break-all">
                        {isSecret ? maskValue(config.value) : config.value}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
