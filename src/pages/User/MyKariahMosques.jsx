// @ts-nocheck
// "Masjid Berdaftar": the mosques the signed-in Google user registered with as
// a Kariah member (qariahmember rows linked to their account). Registering
// itself happens on UserKariahRegistration.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Loader2, MapPin, ChevronRight, UserPlus } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Button } from "@/components/ui/button";
import GoogleSignInDialog from "@/components/GoogleSignInDialog";
import QariahStatusBadge from "@/components/QariahStatusBadge";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { getStoredGoogleUser } from "@/utils/auth";
import {
  useMyQariahRegistrations,
  GOOGLE_SESSION_EXPIRED,
} from "@/mutations/useQariahMemberMutations";

export default function MyKariahMosques() {
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);
  const isSignedIn = !!getStoredGoogleUser();
  const { data: registrations = [], isLoading, error, refetch } =
    useMyQariahRegistrations();

  const needsSignIn =
    !isSignedIn ||
    error?.message === GOOGLE_SESSION_EXPIRED ||
    error?.data?.code === "FORBIDDEN";

  const goRegister = () => navigate(createPageUrl("UserKariahRegistration"));

  return (
    <div className="min-h-screen flex flex-col">
      <BackNavigation title={translate("Enrolled Mosques")} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
        {needsSignIn ? (
          <EmptyState
            message={translate(
              "Please sign in with Google to see the mosques you registered with.",
            )}
            action={
              <Button
                onClick={() => setSignInOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              >
                {translate("Sign in with Google")}
              </Button>
            }
          />
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <EmptyState
            message={translate("Unable to load your mosques. Please try again.")}
            action={
              <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>
                {translate("Retry")}
              </Button>
            }
          />
        ) : registrations.length === 0 ? (
          <EmptyState
            message={translate("You have not registered with any mosque yet.")}
            action={
              <Button
                onClick={goRegister}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {translate("Register as Kariah Member")}
              </Button>
            }
          />
        ) : (
          registrations.map((r) => (
            <RegistrationCard key={r.id} registration={r} />
          ))
        )}
      </div>

      <GoogleSignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        message={translate("Please sign in with Google to continue.")}
        onLoginSuccess={() => refetch()}
      />
    </div>
  );
}

function RegistrationCard({ registration: r }) {
  const body = (
    <>
      <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {r.mosque?.name ?? "—"}
          </p>
          <QariahStatusBadge status={r.status} className="shrink-0" />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
          {r.mosque?.state && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {r.mosque.state}
            </span>
          )}
          <span>{r.fullname}</span>
          <span>
            {new Date(r.createdat).toLocaleDateString("ms-MY")}
          </span>
        </div>
        {r.notes && (
          <p className="text-xs text-red-500 dark:text-red-400">{r.notes}</p>
        )}
      </div>
      {r.mosque?.id && (
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center" />
      )}
    </>
  );

  const className =
    "flex items-start gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm";

  return r.mosque?.id ? (
    <Link
      to={`${createPageUrl("MosqueDetailsPage")}?id=${r.mosque.id}`}
      className={`${className} active:scale-[0.99] transition`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-14 px-6">
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
        <Users className="w-8 h-8 text-emerald-500" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        {message}
      </p>
      {action}
    </div>
  );
}
