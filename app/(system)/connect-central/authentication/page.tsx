"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Globe,
  RefreshCw,
  Copy,
  Download,
  AlertTriangle,
  Check,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Smartphone,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import {
  get2FAStatus,
  getRecoveryCodes,
  regenerateRecoveryCodes,
  disable2FA,
  setup2FA,
  confirm2FA,
} from "@/lib/api/connect-central/auth";
import type {
  RecoveryCodesPayload,
  TotpSetupPayload as OriginalTotpSetupPayload,
  Confirm2FAResponse,
} from "@/lib/api/connect-central/auth";
import { useDispatch } from "react-redux";
import { setAuth } from "@/store/authSlice";

// ── Design tokens ──────────────────────────────────────────────────────────────

const CC_ACCENT = "#6366F1";

// ── Extend the type locally to match the actual API response ────────────────
type TotpSetupPayload = OriginalTotpSetupPayload & {
  secret: string;
  qr_code_uri: string;
  totp_id: string;
};

// ── Setup steps ───────────────────────────────────────────────────────────────

const SETUP_STEPS = ["Scan QR", "Enter OTP"];
const AUTH_APPS = [
  { name: "Google Authenticator", platform: "iOS · Android", color: "#EA4335" },
  { name: "Microsoft Authenticator", platform: "iOS · Android", color: "#0078D4" },
  { name: "Authy", platform: "iOS · Android · Desktop", color: "#EC1C24" },
  { name: "1Password", platform: "All platforms (built-in TOTP)", color: "#1A8CFF" },
];

// ── Provider palette for OAuth tab ───────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  google: "#EA4335",
  microsoft: "#0078D4",
  okta: "#007DC1",
  ldap: "#34D399",
  saml: "#818CF8",
  custom: "#6B7280",
};

// ── Mock OAuth configs (replace with useQuery(getOAuthConfigs)) ──────────────

const MOCK_OAUTH = [
  { uuid: "oauth-1", provider: "google", display_name: "Google SSO", is_active: true },
  { uuid: "oauth-2", provider: "microsoft", display_name: "Azure AD (Entra)", is_active: false },
  { uuid: "oauth-3", provider: "okta", display_name: "Okta SAML", is_active: false },
];

// ── Sub-components ────────────────────────────────────────────────────────────

/** Dark hero card shown when 2FA is active. */
function TwoFactorEnabledBanner({ codesRemaining }: { codesRemaining: number }) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const metrics = [
    { label: "Security Level", value: "High", color: "#34D399" },
    { label: "Method", value: "TOTP", color: "#818CF8" },
    { label: "Recovery Codes", value: `${codesRemaining} left`, color: "#FCD34D" },
    { label: "Last Updated", value: today, color: "#818CF8" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1E2139 0%, #252845 40%, #2D3058 70%, #1E2139 100%)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: CC_ACCENT, transform: "translate(35%, -35%)" }}
      />

      <div className="flex items-start justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "rgba(99,102,241,0.2)",
              boxShadow: "0 0 20px rgba(99,102,241,0.4)",
            }}
          >
            <ShieldCheck className="h-6 w-6" style={{ color: CC_ACCENT }} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">2FA Enabled</p>
            <p className="text-white/50 text-xs mt-0.5">
              Your account is secured with TOTP authentication
            </p>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "#34D399" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] uppercase tracking-wide text-white/40 mb-0.5">
              {m.label}
            </p>
            <p className="text-sm font-semibold" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 relative">
        {SETUP_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(99,102,241,0.3)" }}
              >
                <Check className="h-2.5 w-2.5" style={{ color: "#A5B4FC" }} />
              </div>
              <span className="text-[10px] text-white/50 hidden sm:inline">{label}</span>
            </div>
            {i < SETUP_STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{ backgroundColor: "rgba(99,102,241,0.3)" }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

/** 2FA Setup Wizard - integrated inline. Two steps: scan QR, verify OTP.
 *  On successful OTP confirm, auth is updated and the wizard closes immediately —
 *  no in-wizard recovery-code display. Plain codes are only ever visible again
 *  via the "Regenerate" action in RecoveryCodesSection. */
function TwoFactorSetupWizard({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [setup, setSetup] = useState<TotpSetupPayload | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const dispatch = useDispatch();
  const submitInFlight = useRef(false);
  const initRef = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function extractSecret(setupData: TotpSetupPayload | null): string {
    if (!setupData) return "";
    return setupData.secret ?? "";
  }

  function chunkSecret(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  const { mutate: startSetup, isPending: settingUp } = useMutation({
    mutationFn: setup2FA,
    onSuccess: (data) => {
      setSetup(data as TotpSetupPayload);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to generate QR code. Please refresh and try again." }),
  });

  const { mutate: confirmOtp, isPending: confirming } = useMutation({
    mutationFn: (code: string) => confirm2FA(code),
    onSuccess: (data: Confirm2FAResponse) => {
      dispatch(
        setAuth({
          token: data.token,
          user: data.user,
        })
      );

      qc.invalidateQueries({ queryKey: ["cc-2fa-status"] });
      qc.invalidateQueries({ queryKey: ["cc-recovery-codes"] });
      onComplete(); // auto-finish, no in-wizard recovery-code step
    },
    onError: () => {
      submitInFlight.current = false;
      setOtpError("Invalid code. Please wait for a new code and try again.");
      setOtp("");
      setShakeKey((k) => k + 1);
    },
  });

  // ── Initialise QR setup on mount ─────────────────────────────────────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    startSetup();
  }, [startSetup]);

  // ── OTP auto-submit ───────────────────────────────────────────────────────

  const handleOtpChange = useCallback(
    (val: string) => {
      setOtp(val);
      setOtpError(null);
      if (val.length === 6 && !submitInFlight.current && !confirming) {
        submitInFlight.current = true;
        confirmOtp(val);
      }
    },
    [confirming, confirmOtp],
  );

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleBack = () => {
    if (step === 1) { onCancel(); return; }
    if (step === 2) { setOtp(""); setOtpError(null); submitInFlight.current = false; setStep(1); return; }
  };

  const handleContinue = () => {
    if (step === 1) setStep(2);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const secret = extractSecret(setup);
  const formattedSecret = chunkSecret(secret);

  // ── OTPCountdown ──────────────────────────────────────────────────────────

  function OTPCountdown({ active }: { active: boolean }) {
    const [seconds, setSeconds] = useState(() => {
      const epoch = Math.floor(Date.now() / 1000);
      return 30 - (epoch % 30);
    });

    useEffect(() => {
      if (!active) return;
      const id = setInterval(() => {
        const epoch = Math.floor(Date.now() / 1000);
        setSeconds(30 - (epoch % 30));
      }, 1000);
      return () => clearInterval(id);
    }, [active]);

    const isUrgent = seconds <= 5;

    return (
      <p
        className="text-xs text-center transition-colors"
        style={{ color: isUrgent ? "#EF4444" : "#9CA3AF" }}
      >
        {isUrgent ? "⚠ " : ""}Code refreshes in{" "}
        <span className="font-semibold tabular-nums">{seconds}</span>s
      </p>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Step progress */}
      <div className="flex items-center">
        {SETUP_STEPS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2;
          const done = step > stepNum;
          const active = step === stepNum;

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center shrink-0">
                <motion.div
                  animate={{
                    backgroundColor: done || active ? CC_ACCENT : "#F3F4F6",
                    scale: active ? 1.12 : 1,
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="h-9 w-9 rounded-full flex items-center justify-center shadow-sm"
                >
                  {done ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: active ? "#fff" : "#9CA3AF" }}>
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span
                  className="text-[10px] mt-1 font-medium whitespace-nowrap"
                  style={{
                    color: active ? CC_ACCENT : done ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  {label}
                </span>
              </div>
              {i < SETUP_STEPS.length - 1 && (
                <div className="flex-1 mx-2 mb-4 relative h-0.5 bg-gray-200 rounded overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded"
                    animate={{ width: step > stepNum ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ backgroundColor: CC_ACCENT }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Scan QR */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Scan the QR Code
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Open your authenticator app, tap <strong>Add account</strong> or{" "}
                <strong>+</strong>, then scan the code below.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
                {!setup ? (
                  <Skeleton className="h-44 w-44 rounded-xl" />
                ) : (
                  <div className="p-3 rounded-xl border-2 border-gray-100 bg-white">
                    <img
                      src={setup.qr_code_uri}
                      alt="QR Code for 2FA setup"
                      className="w-[168px] h-[168px]"
                    />
                  </div>
                )}

                <button
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: CC_ACCENT }}
                  onClick={() => setShowManualKey((v) => !v)}
                >
                  {showManualKey ? (
                    <><EyeOff className="h-3.5 w-3.5" /> Hide manual key</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /> Can&apos;t scan? Enter key manually</>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {showManualKey && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden"
                    >
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Manual entry key
                      </p>
                      {settingUp || !secret ? (
                        <Skeleton className="h-10 w-full rounded-lg" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 font-mono text-xs tracking-widest text-gray-700 break-all">
                            {formattedSecret}
                          </code>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(secret);
                              toast.success("Copied!");
                            }}
                            className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center transition-colors hover:bg-gray-50 shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        Type this key into your authenticator app if you cannot
                        scan the QR code.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" style={{ color: CC_ACCENT }} />
                    Recommended authenticator apps
                  </p>
                  {AUTH_APPS.map((app) => (
                    <div
                      key={app.name}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-gray-100 text-xs"
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${app.color}18` }}
                      >
                        <Smartphone className="h-3.5 w-3.5" style={{ color: app.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{app.name}</p>
                        <p className="text-gray-400 text-[10px]">{app.platform}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Verify with your authenticator app
                </p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Enter the 6-digit code shown in your authenticator to confirm
                  the account link. The code auto-submits when all digits are filled.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <motion.div
                  key={shakeKey}
                  animate={
                    shakeKey > 0
                      ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.45 }}
                >
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={confirming}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-14 w-12 text-2xl font-mono rounded-xl border-2 border-gray-200 data-[active=true]:border-indigo-500 data-[active=true]:ring-indigo-200"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </motion.div>

                <OTPCountdown active={step === 2} />

                <AnimatePresence>
                  {confirming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: CC_ACCENT }} />
                      Verifying code…
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {otpError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2"
                style={{ backgroundColor: "#F5F3FF" }}
              >
                <Smartphone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CC_ACCENT }} />
                <span>
                  Open your authenticator app (Google Authenticator, Authy, etc.)
                  and enter the code shown for <strong>Flexi-HRMS</strong>.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation bar */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-sm"
          onClick={handleBack}
          disabled={confirming}
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step === 1 && (
          <Button
            size="sm"
            className="gap-1.5 text-sm"
            style={{ backgroundColor: CC_ACCENT, color: "#fff" }}
            onClick={handleContinue}
            disabled={!setup}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {step === 2 && (
          <p className="text-xs text-gray-400 italic">
            Enter all 6 digits to verify
          </p>
        )}
      </div>
    </div>
  );
}

/** Single recovery code chip. */
function RecoveryCodeChip({ value, isPlain }: { value: string; isPlain: boolean }) {
  const display = isPlain ? value : value.replace(/[*]/g, "•");
  return (
    <code
      className="block px-3 py-2.5 rounded-lg text-[11px] text-center tracking-widest font-mono border transition-colors"
      style={{
        backgroundColor: isPlain ? "#F0FDF4" : "#F9FAFB",
        borderColor: isPlain ? "#86EFAC" : "#E5E7EB",
        color: isPlain ? "#15803D" : "#374151",
      }}
    >
      {display}
    </code>
  );
}

// ── Recovery Codes Section ─────────────────────────────────────────────────────

type RecoveryCodesSectionProps = {
  payload: RecoveryCodesPayload;
  onRegenerate: (password: string) => void;
  isRegenerating: boolean;
};

function RecoveryCodesSection({
  payload,
  onRegenerate,
  isRegenerating,
}: RecoveryCodesSectionProps) {
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");

  const hasPlain = (payload.plain_codes?.length ?? 0) > 0;
  const codes = hasPlain ? (payload.plain_codes ?? []) : payload.masks;
  const codeCount = codes.length;

  const copyAll = async () => {
    if (!hasPlain) return;
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    if (!hasPlain) return;
    const content = [
      "Flexi-HRMS Recovery Codes",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...codes,
      "",
      "Keep these codes safe. Each can be used once.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flexi-hrms-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Recovery Codes</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasPlain
                ? "Save these now — they will not be shown again."
                : `${payload.count} codes available · use one if you lose your authenticator app`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5"
              onClick={copyAll}
              disabled={!hasPlain}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy Codes"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5"
              onClick={download}
              disabled={!hasPlain}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5"
              style={{
                color: "#92400E",
                borderColor: "#FDE68A",
              }}
              onClick={() => setConfirmOpen(true)}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {hasPlain && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
            >
              <p className="text-xs font-semibold text-emerald-700 mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                New codes generated — save them immediately!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {codes.map((c, i) => (
                  <RecoveryCodeChip key={i} value={c} isPlain />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasPlain && (
          <div className={`grid gap-2 ${codeCount > 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
            {codes.map((c, i) => (
              <RecoveryCodeChip key={i} value={c} isPlain={false} />
            ))}
          </div>
        )}

        <div
          className="flex items-start gap-2.5 p-3 rounded-xl text-xs leading-relaxed"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Store recovery codes safely.</strong> Anyone with these codes
            can access your account. Save them in a password manager or a secure
            offline location.
          </p>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <AlertDialogTitle>Regenerate Recovery Codes?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This will permanently invalidate your existing{" "}
              <strong>{payload.count} recovery codes</strong>. New codes will be
              shown only once — save them before leaving this page.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-1 pb-1">
            <Input
              type="password"
              placeholder="Current password"
              value={regenPassword}
              onChange={(e) => setRegenPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRegenPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmOpen(false); onRegenerate(regenPassword); setRegenPassword(""); }}
              disabled={regenPassword.length === 0}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Yes, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Disable 2FA Dialog ────────────────────────────────────────────────────────

type Disable2FADialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (code: string) => void;
  loading: boolean;
};

function Disable2FADialog({ open, onOpenChange, onConfirm, loading }: Disable2FADialogProps) {
  const [code, setCode] = useState("");

  const handleOpenChange = (v: boolean) => {
    if (loading) return;
    if (!v) setCode("");
    onOpenChange(v);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(code) && !loading) onConfirm(code);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ShieldOff className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This removes the extra security layer from your account. Enter your
            six-digit authenticator code to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-1 pb-2">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="Authenticator code"
            disabled={loading}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-11"
            autoFocus
          />
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Enter the six-digit code from your authenticator app
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!/^\d{6}$/.test(code) || loading}
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disabling…
              </>
            ) : (
              "Disable 2FA"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "2fa" | "oauth";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthenticationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("2fa");
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(searchParams.get("setup") === "true");

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["cc-2fa-status"],
    queryFn: get2FAStatus,
    staleTime: 30_000,
  });

  const { data: codesPayload, isLoading: codesLoading } = useQuery({
    queryKey: ["cc-recovery-codes"],
    queryFn: getRecoveryCodes,
    enabled: !!status?.enabled,
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const { mutate: regen, isPending: regenerating } = useMutation({
    mutationFn: (password: string) => regenerateRecoveryCodes(password),
    onSuccess: (data) => {
      qc.setQueryData(["cc-recovery-codes"], data);
      toast.success("Recovery codes regenerated. Save them immediately!");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to regenerate codes. Please try again." }),
  });

  // Updated disable mutation with correct API endpoint
  const { mutate: doDisable, isPending: disabling } = useMutation({
    mutationFn: (code: string) => disable2FA(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cc-2fa-status"] });
      qc.removeQueries({ queryKey: ["cc-recovery-codes"] });
      setDisableDialogOpen(false);
      toast.success("Two-factor authentication has been disabled.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to disable 2FA. Please check your authenticator code and try again.";
      showApiError(error, { fallbackMessage: message });
    },
  });

  const isEnabled = status?.enabled ?? false;

  const handleSetupComplete = () => {
    setShowSetup(false);
    qc.invalidateQueries({ queryKey: ["cc-2fa-status"] });
    qc.invalidateQueries({ queryKey: ["cc-recovery-codes"] });
    toast.success("Two-factor authentication has been enabled!");
    // Remove the setup query param
    router.replace("/connect-central/authentication");
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
    // Remove the setup query param
    router.replace("/connect-central/authentication");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="h-5 w-5" style={{ color: CC_ACCENT }} />
          Authentication
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage two-factor authentication and OAuth / SSO providers
        </p>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
        {(["2fa", "oauth"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "2fa" ? "Two-Factor Auth" : "OAuth / SSO"}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── 2FA tab ────────────────────────────────────────────────────────── */}
        {tab === "2fa" && (
          <motion.div
            key="2fa-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {statusLoading ? (
              <Skeleton className="h-52 w-full rounded-2xl" />
            ) : showSetup || !isEnabled ? (
              /* ── Show setup wizard (when explicitly requested OR 2FA disabled) ── */
              <TwoFactorSetupWizard
                onComplete={handleSetupComplete}
                onCancel={handleSetupCancel}
              />
            ) : (
              /* ── 2FA is enabled → show status + management ────────────── */
              <>
                <TwoFactorEnabledBanner codesRemaining={status?.recovery_codes_count ?? 0} />

                {codesLoading ? (
                  <Skeleton className="h-56 w-full rounded-2xl" />
                ) : codesPayload ? (
                  <RecoveryCodesSection
                    payload={codesPayload}
                    onRegenerate={(password) => regen(password)}
                    isRegenerating={regenerating}
                  />
                ) : null}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Manage 2FA</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Reconfigure your authenticator if you have switched devices, or
                    disable two-factor authentication entirely.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5"
                      style={{ backgroundColor: CC_ACCENT, color: "#fff" }}
                      onClick={() => {
                        setShowSetup(true);
                        router.push("/connect-central/authentication?setup=true");
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Reconfigure 2FA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDisableDialogOpen(true)}
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── OAuth tab ──────────────────────────────────────────────────────── */}
        {tab === "oauth" && (
          <motion.div
            key="oauth-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {MOCK_OAUTH.map((cfg) => {
              const color = PROVIDER_COLORS[cfg.provider] ?? "#6B7280";
              return (
                <div
                  key={cfg.uuid}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Globe className="h-5 w-5" style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {cfg.display_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{cfg.provider}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={
                        cfg.is_active
                          ? { backgroundColor: "#D1FAE5", color: "#065F46" }
                          : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                      }
                    >
                      {cfg.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => router.push("/connect-central/authentication/oauth")}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button
              size="sm"
              className="gap-1.5 text-xs mt-1"
              style={{ backgroundColor: CC_ACCENT, color: "#fff" }}
              onClick={() => router.push("/connect-central/authentication/oauth")}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Manage All OAuth Providers
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Disable 2FA dialog ───────────────────────────────────────────────── */}
      <Disable2FADialog
        key={String(disableDialogOpen)}
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        onConfirm={(code) => doDisable(code)}
        loading={disabling}
      />
    </div>
  );
}