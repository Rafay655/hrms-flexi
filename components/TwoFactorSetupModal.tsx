"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  ShieldCheck,
  Copy,
  Download,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/authSlice";
import {
  setup2FA,
  confirm2FA,
} from "@/lib/api/connect-central/auth";
import type { TotpSetupPayload, Confirm2FAResponse } from "@/lib/api/connect-central/auth";

type Step = "qr" | "otp" | "codes";

type Props = {
  open: boolean;
  /** Called once the user has confirmed OTP and acknowledged saving recovery codes. */
  onComplete: () => void;
};

export default function TwoFactorSetupModal({ open, onComplete }: Props) {
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>("qr");
  const [setup, setSetup] = useState<TotpSetupPayload | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [savedChecked, setSavedChecked] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const submitInFlight = useRef(false);
  const initRef = useRef(false);

  // ── Reset / initialise whenever the modal opens or closes ─────────────────
  useEffect(() => {
    if (!open) {
      initRef.current = false;
      setStep("qr");
      setSetup(null);
      setShowManualKey(false);
      setOtp("");
      setOtpError(null);
      setRecoveryCodes([]);
      setSavedChecked(false);
      setCopiedCodes(false);
      submitInFlight.current = false;
      return;
    }
    if (initRef.current) return;
    initRef.current = true;
    startSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Mutations ───────────────────────────────────────────────────────────

  const { mutate: startSetup, isPending: settingUp } = useMutation({
    mutationFn: setup2FA,
    onSuccess: (data) => setSetup(data),
    onError: () => setOtpError("Failed to generate QR code. Please refresh and try again."),
  });

  const { mutate: confirmOtp, isPending: confirming } = useMutation({
    mutationFn: (code: string) => confirm2FA(code),
    onSuccess: (data: Confirm2FAResponse) => {
      // Refresh auth with the session-bound token/user returned on confirm.
      dispatch(setAuth({ token: data.token, user: data.user }));
      setRecoveryCodes(data.recovery_codes ?? []);
      setStep("codes");
    },
    onError: () => {
      submitInFlight.current = false;
      setOtpError("Invalid code. Please wait for a new code and try again.");
      setOtp("");
      setShakeKey((k) => k + 1);
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────

  const secret = setup?.secret ?? "";
  const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  const handleOtpChange = (val: string) => {
    setOtp(val);
    setOtpError(null);
    if (val.length === 6 && !submitInFlight.current && !confirming) {
      submitInFlight.current = true;
      confirmOtp(val);
    }
  };

  const copyRecoveryCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadRecoveryCodes = () => {
    const lines = [
      "Flexi HRMS — Two-Factor Authentication Recovery Codes",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...recoveryCodes,
      "",
      "Each code can be used only once.",
      "Store this file in a secure location.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flexi-hrms-2fa-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                Two-Factor Authentication Required
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your organization requires 2FA before you can continue.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step: Scan QR ─────────────────────────────────────── */}
            {step === "qr" && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-slate-500 leading-relaxed">
                  Scan the QR code below with an authenticator app (Google
                  Authenticator, Microsoft Authenticator, Authy, 1Password…).
                </p>

                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  {!setup ? (
                    <div className="h-44 w-44 animate-pulse rounded-xl bg-slate-200" />
                  ) : (
                    <div className="rounded-xl border-2 border-slate-100 bg-white p-3">
                      <img
                        src={setup.qr_code_uri}
                        alt="QR Code for 2FA setup"
                        className="h-[168px] w-[168px]"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium text-primary"
                    onClick={() => setShowManualKey((v) => !v)}
                  >
                    {showManualKey ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hide manual key
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Can&apos;t scan? Enter key manually
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {showManualKey && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                          <code className="flex-1 break-all font-mono text-xs tracking-widest text-slate-700">
                            {formattedSecret || "…"}
                          </code>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(secret)}
                            className="shrink-0 rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  disabled={!setup || settingUp}
                  onClick={() => setStep("otp")}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                >
                  {settingUp ? "Generating QR code…" : "I've scanned it — Continue"}
                </button>
              </motion.div>
            )}

            {/* ── Step: Verify OTP ─────────────────────────────────── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <p className="text-sm text-slate-500 leading-relaxed">
                  Enter the 6-digit code from your authenticator app. It
                  submits automatically once all digits are filled.
                </p>

                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    key={shakeKey}
                    animate={shakeKey > 0 ? { x: [0, -10, 10, -7, 7, -4, 4, 0] } : {}}
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
                            className="h-14 w-12 rounded-xl border-2 border-slate-200 font-mono text-2xl"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </motion.div>

                  {confirming && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying code…
                    </div>
                  )}

                  {otpError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {otpError}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-xs text-slate-500">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Open your authenticator app and enter the current code for
                  Flexi HRMS.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("qr");
                    setOtp("");
                    setOtpError(null);
                    submitInFlight.current = false;
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← Back to QR code
                </button>
              </motion.div>
            )}

            {/* ── Step: Save Recovery Codes ────────────────────────── */}
            {step === "codes" && (
              <motion.div
                key="codes"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  2FA is now active — save your recovery codes
                </div>

                <p className="text-sm text-slate-500 leading-relaxed">
                  These codes let you regain access if you lose your
                  authenticator device.{" "}
                  <strong className="text-slate-700">
                    They will not be shown again — store them securely.
                  </strong>
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyRecoveryCodes}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copiedCodes ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedCodes ? "Copied!" : "Copy All"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadRecoveryCodes}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .txt
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {recoveryCodes.map((code, i) => (
                    <code
                      key={i}
                      className="block rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center font-mono text-[11px] tracking-widest text-emerald-700"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Anyone with these codes can access your account. Save
                    them in a password manager or a secure offline location.
                  </p>
                </div>

                <label className="flex cursor-pointer select-none items-center gap-3">
                  <div
                    onClick={() => setSavedChecked((v) => !v)}
                    role="checkbox"
                    aria-checked={savedChecked}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === " " && setSavedChecked((v) => !v)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                    style={{
                      borderColor: savedChecked ? "var(--color-primary, #4f46e5)" : "#D1D5DB",
                      backgroundColor: savedChecked ? "var(--color-primary, #4f46e5)" : "transparent",
                    }}
                  >
                    {savedChecked && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-700">
                    I have saved my recovery codes in a safe place
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!savedChecked}
                  onClick={onComplete}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                >
                  Continue to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}