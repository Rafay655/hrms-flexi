"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle, Loader2, KeyRound } from "lucide-react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/authSlice";
import { verify2FACode, useRecoveryCode } from "@/lib/api/connect-central/auth";
import type { VerifyTotpPayload } from "@/lib/api/connect-central/auth";

type Mode = "otp" | "recovery";

type Props = {
  open: boolean;
  /** Called once the user has verified via OTP or recovery code. */
  token?: string;
  onComplete: () => void;
};

/**
 * Shown on login when `requires_2fa: true` and `2fa_setup_required` is NOT
 * true — i.e. the user already has 2FA configured and just needs to verify
 * with their authenticator app (or a recovery code) to exchange the limited
 * login token for a full session token.
 */
export default function TwoFactorVerifyModal({ open, token, onComplete }: Props) {
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<Mode>("otp");
  const [otp, setOtp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Reset state whenever the modal closes, so it's fresh next time it opens.
  useEffect(() => {
    if (open) return;
    setMode("otp");
    setOtp("");
    setRecoveryCode("");
    setError(null);
  }, [open]);

  const handleSuccess = (data: VerifyTotpPayload) => {
    dispatch(setAuth({ token: data.token, user: data.user }));
    onComplete();
  };

  const handleFailure = (msg: string) => {
    setError(msg);
    setOtp("");
    setShakeKey((k) => k + 1);
  };

  const { mutate: verifyOtp, isPending: verifyingOtp } = useMutation({
    mutationFn: (code: string) => verify2FACode(code),
    onSuccess: handleSuccess,
    onError: () => handleFailure("Invalid code. Please try again."),
  });

  const { mutate: verifyRecovery, isPending: verifyingRecovery } = useMutation({
    mutationFn: (code: string) => useRecoveryCode(code),
    onSuccess: handleSuccess,
    onError: () => handleFailure("Invalid or already-used recovery code."),
  });

  const verifying = verifyingOtp || verifyingRecovery;

  const handleOtpChange = (val: string) => {
    setOtp(val);
    setError(null);
    if (val.length === 6 && !verifying) verifyOtp(val);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = recoveryCode.trim();
    if (code.length !== 10 || verifying) return;
    verifyRecovery(code);
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
          className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                Two-Factor Verification
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === "otp"
                  ? "Enter the 6-digit code from your authenticator app."
                  : "Enter one of your saved 10-character recovery codes."}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "otp" ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
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
                      disabled={verifying}
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

                  {verifyingOtp && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying…
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode("recovery");
                    setError(null);
                    setOtp("");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:opacity-90"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Can&apos;t access your authenticator? Use a recovery code
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="recovery"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleRecoverySubmit}
                className="space-y-4"
              >
                <motion.div
                  key={shakeKey}
                  animate={shakeKey > 0 ? { x: [0, -10, 10, -7, 7, -4, 4, 0] } : {}}
                  transition={{ duration: 0.45 }}
                >
                  <input
                    type="text"
                    autoFocus
                    value={recoveryCode}
                    onChange={(e) => {
                      setError(null);
                      setRecoveryCode(e.target.value.slice(0, 10));
                    }}
                    placeholder="ABCD1234EF"
                    maxLength={10}
                    disabled={verifying}
                    className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-center font-mono text-lg tracking-[0.3em] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </motion.div>

                {verifyingRecovery && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying…
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={recoveryCode.length !== 10 || verifying}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                >
                  Verify Recovery Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("otp");
                    setError(null);
                    setRecoveryCode("");
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← Use my authenticator app instead
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}