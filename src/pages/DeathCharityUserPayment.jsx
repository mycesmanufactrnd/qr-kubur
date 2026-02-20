import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CreditCard, Search, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { createPageUrl } from "@/utils";
import { useGetDeathCharityByMosque } from "@/hooks/useDeathCharityMutations";
import {
  useDeathCharityMemberMutations,
  useSearchMemberByDeathCharity,
} from "@/hooks/useDeathCharityMemberMutations";
import {
  useDeathCharityPaymentMutations,
  useGetPaymentByMemberId,
} from "@/hooks/useDeathCharityPaymentMutations";

const PAYMENT_METHODS = ["cash", "fpx", "bank_transfer", "cheque", "other"];
const PAYMENT_PLAN = {
  REGISTER_ONLY: "register_only",
  REGISTER_AND_YEARLY: "register_and_yearly",
  YEARLY_ONLY: "yearly_only",
};

function formatMoney(amount) {
  return `RM ${Number(amount || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCoverage(payment) {
  const fromYear = Number(payment.coversfromyear || 0);
  const toYear = Number(payment.coverstoyear || payment.coversfromyear || 0);

  if (!fromYear) {
    return "No coverage year";
  }

  if (fromYear === toYear) {
    return String(fromYear);
  }

  return `${fromYear} - ${toYear}`;
}

export default function DeathCharityUserPayment() {
  const [searchParams] = useSearchParams();
  const mosqueId = searchParams.get("mosque") ? Number(searchParams.get("mosque")) : null;
  const currentYear = new Date().getFullYear();

  const backUrl = mosqueId
    ? `${createPageUrl("MosqueDetailsPage")}?id=${mosqueId}`
    : createPageUrl("SearchMosque");

  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [startYear, setStartYear] = useState(currentYear);
  const [yearsToPay, setYearsToPay] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState(PAYMENT_PLAN.REGISTER_AND_YEARLY);
  const [submitError, setSubmitError] = useState("");

  const [registrationForm, setRegistrationForm] = useState({
    fullname: "",
    icnumber: "",
    phone: "",
    address: "",
  });

  const { data: deathCharity, isLoading: loadingDeathCharity } = useGetDeathCharityByMosque(mosqueId);
  const { data: memberResults = [], isFetching: searchingMembers } = useSearchMemberByDeathCharity(
    deathCharity?.id ?? null,
    searchKeyword,
    12,
  );

  const { createPublicDeathCharityMember } = useDeathCharityMemberMutations();
  const { createDeathCharityPayment } = useDeathCharityPaymentMutations();

  const { data: payments = [], isLoading: loadingPayments } = useGetPaymentByMemberId(selectedMember?.id ?? null);

  const registrationFee = Number(deathCharity?.registrationfee || 0);
  const yearlyFee = Number(deathCharity?.yearlyfee || 0);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const yearA = Number(a.coversfromyear || 0);
      const yearB = Number(b.coversfromyear || 0);
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      return new Date(b.paidat || 0).getTime() - new Date(a.paidat || 0).getTime();
    });
  }, [payments]);

  const paidYears = useMemo(() => {
    const years = new Set();

    payments.forEach((payment) => {
      const fromYear = Number(payment.coversfromyear || 0);
      const toYear = Number(payment.coverstoyear || payment.coversfromyear || 0);

      if (!fromYear) {
        return;
      }

      for (let year = fromYear; year <= toYear; year += 1) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [payments]);

  const paidCoverage = useMemo(() => {
    if (!paidYears.length) {
      return null;
    }

    return {
      from: paidYears[0],
      to: paidYears[paidYears.length - 1],
    };
  }, [paidYears]);

  const availablePlans = useMemo(() => {
    if (!selectedMember) {
      return [PAYMENT_PLAN.REGISTER_ONLY, PAYMENT_PLAN.REGISTER_AND_YEARLY];
    }

    // Existing member in DB is treated as already registered.
    return [PAYMENT_PLAN.YEARLY_ONLY];
  }, [selectedMember]);

  useEffect(() => {
    if (!availablePlans.includes(paymentPlan)) {
      setPaymentPlan(availablePlans[0]);
    }
  }, [availablePlans, paymentPlan]);

  const yearlyAmount = yearlyFee * Math.max(1, Number(yearsToPay) || 1);
  const totalAmount = useMemo(() => {
    if (paymentPlan === PAYMENT_PLAN.REGISTER_ONLY) {
      return registrationFee;
    }

    if (paymentPlan === PAYMENT_PLAN.YEARLY_ONLY) {
      return yearlyAmount;
    }

    return registrationFee + yearlyAmount;
  }, [paymentPlan, registrationFee, yearlyAmount]);

  const showRegistrationForm =
    hasSearched && searchKeyword.length > 1 && !searchingMembers && memberResults.length === 0 && !selectedMember;

  const yearOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => currentYear - 1 + idx);
  }, [currentYear]);

  const createRegistrationPayment = paymentPlan === PAYMENT_PLAN.REGISTER_ONLY || paymentPlan === PAYMENT_PLAN.REGISTER_AND_YEARLY;
  const createYearlyPayment = paymentPlan === PAYMENT_PLAN.YEARLY_ONLY || paymentPlan === PAYMENT_PLAN.REGISTER_AND_YEARLY;

  const handleSearchMember = () => {
    const keyword = searchText.trim();

    setSubmitError("");
    setSelectedMember(null);
    setHasSearched(true);

    if (keyword.length < 2) {
      setSearchKeyword("");
      return;
    }

    setSearchKeyword(keyword);
  };

  const handleSubmitPayment = async () => {
    if (!deathCharity?.id) {
      return;
    }

    setSubmitError("");

    const cleanStartYear = Number(startYear) || currentYear;
    const cleanYearsToPay = Math.max(1, Number(yearsToPay) || 1);
    const coverageToYear = cleanStartYear + cleanYearsToPay - 1;

    try {
      let member = selectedMember;

      if (!member) {
        if (!registrationForm.fullname.trim() || !registrationForm.icnumber.trim()) {
          setSubmitError("Full name and IC number are required.");
          return;
        }

        member = await createPublicDeathCharityMember.mutateAsync({
          fullname: registrationForm.fullname.trim(),
          icnumber: registrationForm.icnumber.trim(),
          phone: registrationForm.phone.trim() || null,
          address: registrationForm.address.trim() || null,
          isactive: true,
          deathcharity: { id: Number(deathCharity.id) },
        });

        setSelectedMember(member);
        setSearchKeyword(member.fullname);
        setSearchText(member.fullname);
      }

      if (createRegistrationPayment) {
        await createDeathCharityPayment.mutateAsync({
          member: { id: Number(member.id) },
          amount: registrationFee,
          paymenttype: "registration",
          paymentmethod: paymentMethod,
          referenceno: referenceNo.trim() || null,
          coversfromyear: cleanStartYear,
          coverstoyear: cleanStartYear,
        });
      }

      if (createYearlyPayment) {
        await createDeathCharityPayment.mutateAsync({
          member: { id: Number(member.id) },
          amount: yearlyFee * cleanYearsToPay,
          paymenttype: "yearly",
          paymentmethod: paymentMethod,
          referenceno: referenceNo.trim() || null,
          coversfromyear: cleanStartYear,
          coverstoyear: coverageToYear,
        });
      }
    } catch (error) {
      setSubmitError(error?.message || "Failed to submit payment.");
    }
  };

  if (loadingDeathCharity) {
    return <PageLoadingComponent />;
  }

  if (!mosqueId) {
    return <NoDataCardComponent isPage description="Missing mosque id in URL." />;
  }

  if (!deathCharity) {
    return <NoDataCardComponent isPage description="Death charity is not available for this mosque." />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-8">
      <Link to={backUrl} className="inline-flex">
        <Button variant="ghost" className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mosque
        </Button>
      </Link>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Death Charity Registration & Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-sm font-semibold text-orange-800">{deathCharity.name}</p>
            <p className="text-xs text-orange-700">
              Registration: {formatMoney(registrationFee)} | Yearly: {formatMoney(yearlyFee)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Search your name or IC number</Label>
            <div className="flex gap-2">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Example: Ahmad or 900101011234"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearchMember();
                  }
                }}
              />
              <Button type="button" onClick={handleSearchMember}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
            {hasSearched && searchText.trim().length < 2 && (
              <p className="text-xs text-red-600">Please enter at least 2 characters to search.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {hasSearched && searchingMembers && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-8 text-center text-sm text-slate-600">Searching member...</CardContent>
        </Card>
      )}

      {memberResults.length > 0 && !selectedMember && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberResults.map((member) => (
              <div key={member.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{member.fullname}</p>
                    <p className="text-xs text-slate-500">IC: {member.icnumber}</p>
                    {member.phone && <p className="text-xs text-slate-500">Phone: {member.phone}</p>}
                  </div>
                  <Button size="sm" onClick={() => setSelectedMember(member)}>
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showRegistrationForm && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Member Not Found, Register Here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={registrationForm.fullname}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({ ...prev, fullname: event.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>IC Number</Label>
              <Input
                value={registrationForm.icnumber}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({ ...prev, icnumber: event.target.value }))
                }
                placeholder="Enter IC number"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={registrationForm.phone}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={registrationForm.address}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Optional"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(selectedMember || showRegistrationForm) && (
        <>
          {selectedMember && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Selected Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-emerald-700" />
                    <p className="font-semibold text-emerald-800">{selectedMember.fullname}</p>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">IC: {selectedMember.icnumber}</p>
                </div>

                {loadingPayments ? (
                  <p className="text-sm text-slate-600">Loading payment history...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">Total Paid</p>
                        <p className="text-lg font-bold text-blue-800">
                          {formatMoney(payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))}
                        </p>
                      </div>
                      <div className="rounded-lg bg-violet-50 p-3">
                        <p className="text-xs text-violet-700">Paid Coverage</p>
                        <p className="text-sm font-semibold text-violet-800">
                          {paidCoverage ? `${paidCoverage.from} - ${paidCoverage.to}` : "No year coverage yet"}
                        </p>
                      </div>
                    </div>

                    {sortedPayments.length > 0 && (
                      <div className="space-y-2">
                        {sortedPayments.map((payment) => (
                          <div key={payment.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold capitalize text-slate-800">
                                  {payment.paymenttype}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Coverage: {formatCoverage(payment)} | Method: {payment.paymentmethod}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Paid: {payment.paidat ? new Date(payment.paidat).toLocaleDateString("en-GB") : "-"}
                                </p>
                              </div>
                              <Badge variant="secondary">{formatMoney(payment.amount)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Make Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Plan</Label>
                <div className="flex flex-wrap gap-2">
                  {availablePlans.map((plan) => {
                    const planLabel =
                      plan === PAYMENT_PLAN.REGISTER_ONLY
                        ? "Register Only"
                        : plan === PAYMENT_PLAN.REGISTER_AND_YEARLY
                          ? "Register + Yearly"
                          : "Yearly Only";

                    const isActive = paymentPlan === plan;

                    return (
                      <Button
                        key={plan}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => setPaymentPlan(plan)}
                      >
                        {planLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Starting Year</Label>
                  <Select value={String(startYear)} onValueChange={(value) => setStartYear(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {createYearlyPayment && (
                  <div className="space-y-2">
                    <Label>How Many Years</Label>
                    <Input
                      type="number"
                      min={1}
                      value={yearsToPay}
                      onChange={(event) => setYearsToPay(Math.max(1, Number(event.target.value) || 1))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method === "fpx"
                            ? "FPX"
                            : method
                                .split("_")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference No.</Label>
                  <Input
                    value={referenceNo}
                    onChange={(event) => setReferenceNo(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Total Payment</p>
                  <p className="text-xl font-bold text-slate-900">{formatMoney(totalAmount)}</p>
                </div>
                {createYearlyPayment && (
                  <p className="mt-1 text-xs text-slate-600">
                    Coverage year: {startYear} - {startYear + Math.max(1, Number(yearsToPay) || 1) - 1}
                  </p>
                )}
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <Button
                className="w-full"
                onClick={handleSubmitPayment}
                disabled={createPublicDeathCharityMember.isPending || createDeathCharityPayment.isPending}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {selectedMember ? "Pay Now" : "Register and Pay"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="border-0 shadow-md">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Keep yearly payment active
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Fees follow mosque death charity setup
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
