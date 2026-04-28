import { createWorker } from "tesseract.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CreditCard,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createPageUrl } from "@/utils";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useGetDeathCharityByMosque } from "@/hooks/useDeathCharityMutations";
import { useGetMosqueById } from "@/hooks/useMosqueMutations";
import {
  useDeathCharityMemberMutations,
  useSearchMemberByDeathCharity,
} from "@/hooks/useDeathCharityMemberMutations";
import {
  useDeathCharityPaymentMutations,
  useGetPaymentByMemberId,
} from "@/hooks/useDeathCharityPaymentMutations";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { trpc } from "@/utils/trpc";
import { paymentToyyibStatus, PLATFORM_FEE } from "@/utils/enums";
import { validateFields } from "@/utils/validations";
import { activityLogError, clearQueryParams, formatRM } from "@/utils/helpers";
import PaymentSuccessfulComponent from "@/components/PaymentSuccessfulComponent";
import { translate } from "@/utils/translations";

const PAYMENT_PLAN = {
  REGISTER_ONLY: "register_only",
  REGISTER_AND_YEARLY: "register_and_yearly",
  YEARLY_ONLY: "yearly_only",
};

const SAVED_PHONE_KEY = "userphoneno";

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
  const mosqueId = searchParams.get("mosque")
    ? Number(searchParams.get("mosque"))
    : null;

  const status_id = searchParams.get("status_id");
  const order_id = searchParams.get("order_id");

  const currentYear = new Date().getFullYear();

  const backUrl = mosqueId
    ? `${createPageUrl("MosqueDetailsPage")}?id=${mosqueId}`
    : createPageUrl("SearchMosque");

  const [loadingPayment, setLoadingPayment] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [startYear, setStartYear] = useState(currentYear);
  const [yearsToPay, setYearsToPay] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState(
    PAYMENT_PLAN.REGISTER_AND_YEARLY,
  );
  const [submitError, setSubmitError] = useState("");
  const [showSavePhoneDialog, setShowSavePhoneDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingPhone, setPendingPhone] = useState("");

  // showCameraMode : camera UI is visible
  // capturedImage  : base64 data-URL of the frozen frame shown as still preview after capture
  // isProcessing   : true while Tesseract is reading the captured frame
  // detectedIC     : the 12-digit IC string found by OCR — shown prominently before search fires
  // ocrError       : human-readable error when OCR finds nothing or fails
  const [showCameraMode, setShowCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIC, setDetectedIC] = useState("");
  const [ocrError, setOcrError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [registrationForm, setRegistrationForm] = useState({
    fullname: "",
    icnumber: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PHONE_KEY);
    if (saved) {
      setRegistrationForm((prev) => ({ ...prev, phone: prev.phone || saved }));
    }
  }, []);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const saveTransactionAccountMutation =
    trpc.toyyibPay.saveTransactionAccount.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createDeathCharityRunningNoMutation =
    trpc.runningNo.createDeathCharityRunningNo.useMutation();

  const { data: deathCharity, isLoading: loadingDeathCharity } =
    useGetDeathCharityByMosque(mosqueId);
  const { data: mosque } = useGetMosqueById(mosqueId);
  const { data: memberResults = [], isFetching: searchingMembers } =
    useSearchMemberByDeathCharity(deathCharity?.id ?? null, searchKeyword, 12);

  const { createPublicDeathCharityMember } = useDeathCharityMemberMutations();
  const { createDeathCharityPayment } = useDeathCharityPaymentMutations();

  const { data: payments = [], isLoading: loadingPayments } =
    useGetPaymentByMemberId(selectedMember?.id ?? null);

  const registrationFee = Number(deathCharity?.registrationfee || 0);
  const yearlyFee = Number(deathCharity?.yearlyfee || 0);

  const organisationId =
    deathCharity?.organisation?.id ?? mosque?.organisation?.id ?? null;
  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: organisationId ?? undefined,
    entityType: "organisation",
    enabled: !!organisationId,
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};

    paymentConfigs.forEach((config) => {
      if (!config.paymentplatform) return;

      const code = config.paymentplatform.code;

      if (!map[code]) {
        map[code] = {
          code,
          name: config.paymentplatform.name,
          fields: [],
        };
      }

      if (config.paymentfield) {
        map[code].fields.push({
          key: config.paymentfield.key,
          label: config.paymentfield.label,
          fieldtype: config.paymentfield.fieldtype,
          value: config.value,
        });
      }
    });

    return Object.values(map);
  }, [paymentConfigs]);

  const selectedPlatform = paymentPlatforms.find(
    (platform) => platform.code === paymentMethod,
  );
  const selectedAccount = useMemo(() => {
    if (!selectedPlatform?.fields?.length) {
      return { bankname: "", accountno: "" };
    }

    const fields = selectedPlatform.fields;

    const bankname =
      fields.find((f) => f.key === "bank_name")?.value?.trim() || "";

    const accountno =
      fields.find((f) => f.key === "account_no")?.value?.trim() || "";

    return { bankname, accountno };
  }, [selectedPlatform]);

  useEffect(() => {
    if (!paymentPlatforms.length) {
      setPaymentMethod("");
      return;
    }

    const exists = paymentPlatforms.some(
      (platform) => platform.code === paymentMethod,
    );

    if (!exists) {
      setPaymentMethod(paymentPlatforms[0].code);
    }
  }, [paymentPlatforms, paymentMethod]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const yearA = Number(a.coversfromyear || 0);
      const yearB = Number(b.coversfromyear || 0);
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      return (
        new Date(b.paidat || 0).getTime() - new Date(a.paidat || 0).getTime()
      );
    });
  }, [payments]);

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
  const subtotalAmount = useMemo(() => {
    if (paymentPlan === PAYMENT_PLAN.REGISTER_ONLY) {
      return registrationFee;
    }

    if (paymentPlan === PAYMENT_PLAN.YEARLY_ONLY) {
      return yearlyAmount;
    }

    return registrationFee + yearlyAmount;
  }, [paymentPlan, registrationFee, yearlyAmount]);

  const totalAmount = useMemo(() => {
    return Number(subtotalAmount || 0) + Number(PLATFORM_FEE || 0);
  }, [subtotalAmount]);

  const showRegistrationPrompt =
    hasSearched &&
    searchKeyword.length > 1 &&
    !searchingMembers &&
    memberResults.length === 0 &&
    !selectedMember;
  const showRegistrationForm =
    showRegistrationPrompt && Boolean(deathCharity?.isselfregister);
  const showNoSelfRegisterMessage =
    showRegistrationPrompt && !deathCharity?.isselfregister;

  const yearOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => currentYear - 1 + idx);
  }, [currentYear]);

  const createRegistrationPayment =
    paymentPlan === PAYMENT_PLAN.REGISTER_ONLY ||
    paymentPlan === PAYMENT_PLAN.REGISTER_AND_YEARLY;
  const createYearlyPayment =
    paymentPlan === PAYMENT_PLAN.YEARLY_ONLY ||
    paymentPlan === PAYMENT_PLAN.REGISTER_AND_YEARLY;

  useEffect(() => {
    const statusText = status_id
      ? paymentToyyibStatus[status_id] || "Unknown"
      : "Unknown";

    if (!status_id) return;

    const pendingPaymentRaw = sessionStorage.getItem("charityPaymentPending");
    if (!pendingPaymentRaw) return;

    const pendingPayment = JSON.parse(pendingPaymentRaw);

    const handleFinally = () => {
      const cleanUrl = clearQueryParams();

      if (!cleanUrl) return;

      const url = new URL(cleanUrl);

      if (pendingPayment?.mosqueid) {
        url.searchParams.set("mosque", String(pendingPayment.mosqueid));
      }

      sessionStorage.removeItem("charityPaymentPending");
      setLoadingPayment(false);

      window.location.href = url.toString();
    };

    if (statusText === "Success") {
      setLoadingPayment(true);
      showSuccess("Pembayaran berjaya!");

      const storedUser =
        localStorage.getItem("googleAuth") ||
        sessionStorage.getItem("googleAuth");
      let googleRecordPayload = null;

      if (storedUser) {
        googleRecordPayload = JSON.parse(storedUser);
      }

      const processSuccessPayment = async () => {
        let memberId = pendingPayment?.member?.id
          ? Number(pendingPayment.member.id)
          : null;

        if (!memberId && pendingPayment?.registrationForm) {
          const member = await createPublicDeathCharityMember.mutateAsync({
            fullname: (pendingPayment.registrationForm.fullname || "").trim(),
            icnumber: (pendingPayment.registrationForm.icnumber || "").trim(),
            phone: pendingPayment.registrationForm.phone?.trim() || null,
            email: pendingPayment.registrationForm.email?.trim() || null,
            address: pendingPayment.registrationForm.address?.trim() || null,
            isactive: true,
            deathcharity: { id: Number(pendingPayment.deathcharity.id) },
          });

          memberId = Number(member.id);
          setSelectedMember(member);
          setSearchText(member.fullname || "");
          setSearchKeyword(member.fullname || "");
        }

        if (!memberId) {
          throw new Error("Member information is missing.");
        }

        const referenceNo = order_id || pendingPayment.referenceno || null;

        if (pendingPayment.createRegistrationPayment) {
          await createDeathCharityPayment.mutateAsync({
            member: { id: memberId },
            amount: Number(pendingPayment.registrationamount || 0),
            paymenttype: "registration",
            paymentmethod: pendingPayment.paymentmethod,
            referenceno: referenceNo,
            coversfromyear: Number(pendingPayment.coversfromyear),
            coverstoyear: Number(pendingPayment.coversfromyear),
            googleuserId: googleRecordPayload?.id ?? null,
          });
        }

        if (pendingPayment.createYearlyPayment) {
          await createDeathCharityPayment.mutateAsync({
            member: { id: memberId },
            amount: Number(pendingPayment.yearlyamount || 0),
            paymenttype: "yearly",
            paymentmethod: pendingPayment.paymentmethod,
            referenceno: referenceNo,
            coversfromyear: Number(pendingPayment.coversfromyear),
            coverstoyear: Number(pendingPayment.coverstoyear),
            googleuserId: googleRecordPayload?.id ?? null,
          });
        }

        const orderNo = String(order_id || "");
        if (
          orderNo &&
          pendingPayment?.selectedAccount?.accountno &&
          pendingPayment?.selectedAccount?.bankname
        ) {
          try {
            await saveTransactionAccountMutation.mutateAsync({
              orderNo,
              accountNo: String(pendingPayment.selectedAccount.accountno),
              bankName: String(pendingPayment.selectedAccount.bankname),
              type: "Death Charity",
            });
          } catch (accountError) {
            await createLogMutation.mutateAsync({
              activitytype: "Save Transaction Account",
              functionname: "saveTransactionAccountMutation.mutateAsync",
              useremail: "",
              level: "error",
              summary: activityLogError(accountError),
              extramessage: JSON.stringify({
                orderNo,
                selectedAccount: pendingPayment?.selectedAccount,
              }),
            });
          }
        }
      };

      processSuccessPayment()
        .catch((error) => {
          const message = error?.message || "Failed to save payment.";
          setSubmitError(message);
          showError(message);

          createLogMutation.mutateAsync({
            activitytype: "Create Death Charity Payment",
            functionname: "createDeathCharityPayment.mutateAsync",
            useremail: "",
            level: "error",
            summary: activityLogError(error),
            extramessage: pendingPaymentRaw,
          });
        })
        .finally(() => {
          handleFinally();
        });
    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
      setLoadingPayment(false);
    } else {
      showError("Pembayaran gagal.");
      setLoadingPayment(false);
    }
  }, [searchParams]);

  // ── IC PHOTO SCAN FUNCTIONS ───────────────────────────────────────────────

  // Malaysian IC number patterns:
  //  formatted : 900101-01-1234  (YYMMDD-SS-NNNN)
  //  raw       : 900101011234    (12 consecutive digits)
  //
  // OCR often adds spaces or garbles dashes so:
  //   1. Try formatted pattern allowing optional separators (no \b — word boundaries fail on OCR noise)
  //   2. Strip ALL non-digits and look for any 12-digit run as a fallback
  const extractICNumber = (text) => {
    const formatted = text.match(/\d{6}[\s\-_|.]*\d{2}[\s\-_|.]*\d{4}/);
    if (formatted) {
      const digits = formatted[0].replace(/\D/g, "");
      if (digits.length === 12) return digits;
    }
    const digitsOnly = text.replace(/\D/g, "");
    const raw = digitsOnly.match(/\d{12}/);
    if (raw) return raw[0];
    return null;
  };

  // Opens the rear camera stream into the <video> element.
  // getUserMedia keeps the browser tab alive — no iOS page-reload issue.
  const startCamera = async () => {
    setOcrError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setOcrError("Cannot access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Freezes the current video frame, stops the live feed, then runs OCR on the still image.
  // Grayscale + contrast preprocessing before Tesseract significantly improves digit accuracy.
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const dW = video.clientWidth; // pixels actually displayed on screen
    const dH = video.clientHeight;
    const vW = video.videoWidth; // native camera resolution
    const vH = video.videoHeight;

    // Replicate objectFit:cover — scale so the smaller dimension fills the display,
    // then centre-crop the larger dimension.
    const scale = Math.max(dW / vW, dH / vH);
    const srcW = dW / scale;
    const srcH = dH / scale;
    const srcX = (vW - srcW) / 2;
    const srcY = (vH - srcH) / 2;

    // Canvas size matches the crop region (same pixels the user saw on screen).
    canvas.width = Math.round(srcW);
    canvas.height = Math.round(srcH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      video,
      srcX,
      srcY,
      srcW,
      srcH,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Show the frozen frame as a still preview and stop live stream
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();

    setIsProcessing(true);
    setDetectedIC("");
    setOcrError("");

    // Grayscale + contrast stretch so Tesseract reads dark digits on coloured backgrounds
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
      const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
      px[i] = px[i + 1] = px[i + 2] = enhanced;
    }
    ctx.putImageData(imgData, 0, 0);

    try {
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789-",
        tessedit_pageseg_mode: "11", // sparse text — finds digits anywhere on the image
      });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const icNumber = extractICNumber(data.text);
      if (icNumber) {
        setDetectedIC(icNumber);
        setSearchText(icNumber);
        setSearchKeyword(icNumber);
        setHasSearched(true);
      } else {
        setOcrError("No IC number found. Try retaking with better lighting.");
      }
    } catch {
      setOcrError("Failed to read the photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setDetectedIC("");
    setOcrError("");
    setIsProcessing(false);
    startCamera();
  };

  const closeCamera = () => {
    stopCamera();
    setCapturedImage(null);
    setDetectedIC("");
    setOcrError("");
    setIsProcessing(false);
    setShowCameraMode(false);
  };

  // Release camera when user navigates away.
  useEffect(() => {
    return () => stopCamera();
  }, []);

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

  const handlePaymentConfig = async (paymentData) => {
    if (!paymentData) return false;

    setLoadingPayment(true);

    const nextRunningNo =
      await createDeathCharityRunningNoMutation.mutateAsync();
    const year = new Date().getFullYear();
    const runningNo = `DCP-${year}-${String(nextRunningNo).padStart(4, "0")}`;

    const payloadWithReferenceNo = {
      ...paymentData,
      referenceno: runningNo,
      selectedAccount,
    };

    sessionStorage.setItem(
      "charityPaymentPending",
      JSON.stringify(payloadWithReferenceNo),
    );

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: Number(paymentData.totalamount || 0),
        referenceNo: runningNo,
        name: paymentData.payername || "ANONYMOUS",
        email: paymentData.payeremail || "noreply@gmail.com",
        phone: paymentData.payerphone || "0123456789",
        returnTo: "deathcharity",
      });

      if (bill?.paymentUrl) {
        window.location.href = bill.paymentUrl;
        return true;
      }

      const errorMessage = bill?.message || "No payment URL returned.";

      setLoadingPayment(false);
      setSubmitError(errorMessage);
      showError(errorMessage);

      return false;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unknown error";

      setLoadingPayment(false);
      setSubmitError(errorMessage);
      showError(errorMessage);

      return false;
    }
  };

  const handleSubmitPayment = async () => {
    if (!deathCharity?.id) {
      return;
    }

    setSubmitError("");

    if (!paymentPlatforms.length) {
      setSubmitError("Payment method is not configured for this organisation.");
      return;
    }

    if (
      !paymentMethod ||
      !paymentPlatforms.some((platform) => platform.code === paymentMethod)
    ) {
      setSubmitError("Please select a valid payment method.");
      return;
    }

    if (!selectedMember && !deathCharity?.isselfregister) {
      setSubmitError(
        "Self registration is not allowed. Please contact mosque admin to register at the mosque.",
      );
      return;
    }

    if (!selectedMember) {
      const isValidRegistration = validateFields(registrationForm, [
        { field: "fullname", label: "Full Name", type: "text" },
        { field: "icnumber", label: "IC No.", type: "text" },
        {
          field: "phone",
          label: "Phone Number",
          type: "phone",
          required: false,
        },
        { field: "email", label: "Email", type: "email", required: false },
      ]);

      if (!isValidRegistration) {
        return;
      }
    }

    const cleanStartYear = Number(startYear) || currentYear;
    const cleanYearsToPay = Math.max(1, Number(yearsToPay) || 1);
    const coverageToYear = cleanStartYear + cleanYearsToPay - 1;

    const paymentData = {
      mosqueid: Number(mosqueId),
      deathcharity: { id: Number(deathCharity.id) },
      member: selectedMember ? { id: Number(selectedMember.id) } : null,
      registrationForm: selectedMember
        ? null
        : {
            fullname: registrationForm.fullname.trim(),
            icnumber: registrationForm.icnumber.trim(),
            phone: registrationForm.phone.trim() || null,
            email: registrationForm.email.trim() || null,
            address: registrationForm.address.trim() || null,
          },
      paymentmethod: paymentMethod,
      coversfromyear: cleanStartYear,
      coverstoyear: coverageToYear,
      createRegistrationPayment,
      createYearlyPayment,
      registrationamount: Number(registrationFee || 0),
      yearlyamount: Number(yearlyFee * cleanYearsToPay || 0),
      totalamount: Number(totalAmount || 0),
      payername:
        selectedMember?.fullname ||
        registrationForm.fullname.trim() ||
        "ANONYMOUS",
      payeremail:
        selectedMember?.email ||
        registrationForm.email.trim() ||
        "noreply@gmail.com",
      payerphone:
        selectedMember?.phone || registrationForm.phone.trim() || "0123456789",
    };

    const phone = (selectedMember?.phone || registrationForm.phone)?.trim();
    const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);

    if (phone && phone !== savedPhone) {
      setPendingPayload(paymentData);
      setPendingPhone(phone);
      setShowSavePhoneDialog(true);
      return;
    }

    await proceedToPayment(paymentData);
  };

  const proceedToPayment = async (payload) => {
    const resPayment = await handlePaymentConfig(payload);
    if (!resPayment) {
      showError("Payment Failed");
      setLoadingPayment(false);
    }
  };

  if (loadingDeathCharity || loadingPayment) {
    return <PageLoadingComponent />;
  }

  if (status_id) {
    return <PaymentSuccessfulComponent />;
  }

  if (!mosqueId) {
    return (
      <NoDataCardComponent isPage description="Missing mosque ID in URL." />
    );
  }

  if (!deathCharity) {
    return (
      <NoDataCardComponent
        isPage
        description="Death charity is not available for this mosque."
      />
    );
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
          <CardTitle className="text-lg">
            Death Charity Registration & Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-sm font-semibold text-orange-800">
              {deathCharity.name}
            </p>
            <p className="text-xs text-orange-700">
              Registration: {formatRM(registrationFee)} | Yearly:{" "}
              {formatRM(yearlyFee)}
            </p>
          </div>

          {/* Manual Scan */}
          {/* <div className="space-y-2">
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
              <p className="text-xs text-red-600">
                Please enter at least 2 characters to search.
              </p>
            )}
          </div> */}

          <div className="space-y-2">
            <Label>Scan your MyKad IC</Label>

            {!showCameraMode && (
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setShowCameraMode(true);
                  startCamera();
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Open Camera
              </Button>
            )}

            {showCameraMode && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="overflow-hidden rounded-md bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                    style={{
                      maxHeight: "220px",
                      objectFit: "cover",
                      display: capturedImage ? "none" : "block",
                    }}
                  />
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured frame"
                      className="w-full object-contain"
                      style={{ maxHeight: "220px" }}
                    />
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {detectedIC && (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-medium text-emerald-600">
                      IC Number Detected
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-emerald-800">
                      {detectedIC}
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    Reading IC number…
                  </div>
                )}

                {ocrError && <p className="text-xs text-red-600">{ocrError}</p>}

                <div className="flex gap-2">
                  {!capturedImage && (
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={capturePhoto}
                    >
                      <Camera className="mr-2 h-3.5 w-3.5" />
                      Capture
                    </Button>
                  )}
                  {capturedImage && (
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      disabled={isProcessing}
                      onClick={retakePhoto}
                    >
                      Retake
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={closeCamera}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasSearched && searchingMembers && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Searching member...
          </CardContent>
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
                    <p className="font-semibold text-slate-800">
                      {member.fullname}
                    </p>
                    <p className="text-xs text-slate-500">
                      IC: {member.icnumber}
                    </p>
                    {member.phone && (
                      <p className="text-xs text-slate-500">
                        Phone: {member.phone}
                      </p>
                    )}
                    {member.email && (
                      <p className="text-xs text-slate-500">
                        Email: {member.email}
                      </p>
                    )}
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

      {showNoSelfRegisterMessage && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Member Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">
              Self registration is disabled. Please contact mosque admin and
              register at the mosque.
            </p>
          </CardContent>
        </Card>
      )}

      {showRegistrationForm && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Member Not Found, Register Here
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={registrationForm.fullname}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({
                    ...prev,
                    fullname: event.target.value,
                  }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("IC No")}</Label>
              <Input
                value={registrationForm.icnumber}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({
                    ...prev,
                    icnumber: event.target.value,
                  }))
                }
                placeholder="Enter IC number"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={registrationForm.phone}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={registrationForm.email}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={registrationForm.address}
                onChange={(event) =>
                  setRegistrationForm((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
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
                    <p className="font-semibold text-emerald-800">
                      {selectedMember.fullname}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">
                    IC: {selectedMember.icnumber}
                  </p>
                  {selectedMember.phone && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Phone: {selectedMember.phone}
                    </p>
                  )}
                  {selectedMember.email && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Email: {selectedMember.email}
                    </p>
                  )}
                </div>

                {loadingPayments ? (
                  <p className="text-sm text-slate-600">
                    Loading payment history...
                  </p>
                ) : (
                  <>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-xs text-blue-700">Total Paid</p>
                      <p className="text-lg font-bold text-blue-800">
                        {formatRM(
                          payments.reduce(
                            (sum, item) => sum + (Number(item.amount) || 0),
                            0,
                          ),
                        )}
                      </p>
                    </div>

                    {sortedPayments.length > 0 && (
                      <div className="divide-y divide-slate-100">
                        {sortedPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-start justify-between gap-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium capitalize text-slate-800">
                                {payment.paymenttype}
                              </p>

                              <p className="text-xs text-slate-500">
                                Coverage: {formatCoverage(payment)} · Method:{" "}
                                <span className="capitalize">
                                  {payment.paymentmethod}
                                </span>
                              </p>

                              <p className="text-xs text-slate-400">
                                Paid:{" "}
                                {payment.paidat
                                  ? new Date(payment.paidat).toLocaleDateString(
                                      "en-GB",
                                    )
                                  : "-"}
                              </p>
                            </div>

                            {/* Right amount */}
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-800">
                                {formatRM(payment.amount)}
                              </p>
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
                  <Select
                    value={String(startYear)}
                    onValueChange={(value) => setStartYear(Number(value))}
                  >
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
                      onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                          setYearsToPay("");
                        } else {
                          setYearsToPay(Math.max(1, Number(value)));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {paymentPlatforms.length > 0 && (
                <div className="space-y-2 pt-1">
                  <Label>Payment Method</Label>
                  <div className="rounded-lg border p-3">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <div className="space-y-2">
                        {paymentPlatforms.map((platform) => (
                          <Label
                            key={platform.code}
                            className="flex cursor-pointer items-center gap-3 rounded border p-3"
                          >
                            <RadioGroupItem value={platform.code} />
                            <CreditCard className="h-4 w-4" />
                            {platform.name}
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>

                    {selectedPlatform && (
                      <div className="mt-3 space-y-2">
                        {selectedPlatform.fields.map((field) =>
                          field.fieldtype === "image" ? (
                            <img
                              key={field.key}
                              src={field.value}
                              alt={field.label}
                              className="max-w-xs rounded border"
                            />
                          ) : (
                            <p key={field.key} className="text-sm">
                              <strong>{field.label}:</strong> {field.value}
                            </p>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentPlatforms.length === 0 && (
                <p className="text-sm text-red-600">
                  Payment method is not configured for this organisation.
                </p>
              )}

              <div className="rounded-lg bg-slate-100 p-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Subtotal</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatRM(subtotalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Maintenance Fee</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatRM(PLATFORM_FEE)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Total Payment
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatRM(totalAmount)}
                    </p>
                  </div>
                </div>
                {createYearlyPayment && (
                  <p className="mt-1 text-xs text-slate-600">
                    Coverage year: {startYear} -{" "}
                    {startYear + Math.max(1, Number(yearsToPay) || 1) - 1}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}

              <Button
                className="w-full"
                onClick={handleSubmitPayment}
                disabled={
                  loadingPayment ||
                  createPublicDeathCharityMember.isPending ||
                  createDeathCharityPayment.isPending ||
                  createBillMutation.isPending ||
                  createDeathCharityRunningNoMutation.isPending
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
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

      <ConfirmDialog
        isMobile
        open={showSavePhoneDialog}
        onOpenChange={(open) => {
          setShowSavePhoneDialog(open);
          if (!open && pendingPayload) {
            const payload = pendingPayload;
            setPendingPayload(null);
            setPendingPhone("");
            proceedToPayment(payload);
          }
        }}
        title="Simpan No. Telefon"
        description={`Simpan ${pendingPhone} untuk kegunaan masa hadapan?`}
        confirmText="Simpan"
        cancelText="Tidak"
        onConfirm={() => {
          localStorage.setItem(SAVED_PHONE_KEY, pendingPhone);
        }}
      />
    </div>
  );
}
