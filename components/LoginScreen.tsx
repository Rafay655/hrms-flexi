// components/LoginScreen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import LoginSuccessModal from "@/components/modal/LoginSuccessModal";
import TwoFactorSetupModal from "@/components/TwoFactorSetupModal";
import TwoFactorVerifyModal from "@/components/TwoFactorVerifyModal";
import ButtonSpinner from "@/components/ui/ButtonSpinner";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { FeatureCard } from "./ui/feature-card";
import { Stat } from "./ui/Stat";

import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/authSlice";
import { setActiveModuleId } from "@/store/sidebarSlice";
import { savedModuleDestination } from "@/lib/module-navigation";

import {
  loginApi,
  forgotPasswordApi,
  verifyOtpApi,
  resetPasswordApi,
  sendLoginOtpApi,
  verifyLoginOtpApi,
} from "@/lib/authApi";

type Mode = "password" | "otp";
type AuthStep = "credentials" | "otp";
type ForgotStep = "none" | "email" | "otp" | "reset";

const getErrMsg = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const data: any = err.response?.data;

    const firstFieldError =
      data?.errors && typeof data.errors === "object"
        ? (Object.values(data.errors)?.[0] as any)?.[0]
        : null;

    return firstFieldError || data?.message || "Request failed";
  }

  return err instanceof Error ? err.message : "Request failed";
};

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("password");
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");

  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [force2FASetupOpen, setForce2FASetupOpen] = useState(false);
  const [require2FAVerifyOpen, setRequire2FAVerifyOpen] = useState(false);

  const [forgotStep, setForgotStep] = useState<ForgotStep>("none");
  const [forgotEmail, setForgotEmail] = useState("support@hrpsp.net");
  const [forgotOtp, setForgotOtp] = useState("");
  const [timer, setTimer] = useState(0);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [otpEmail, setOtpEmail] = useState("support@hrpsp.net");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const demoEmail = "support@hrpsp.net";
  const demoPass = "password";
  const deviceName = "web";

  const btnText = useMemo(() => {
    if (mode === "password") return "Login";
    return authStep === "credentials" ? "Send Code" : "Verify Code";
  }, [mode, authStep]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const startTimer = (secs = 60) => setTimer(secs);
  const startOtpTimer = (secs = 60) => setOtpTimer(secs);

  useEffect(() => {
    if (timer <= 0) return;

    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (otpTimer <= 0) return;

    const id = setInterval(() => {
      setOtpTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [otpTimer]);

  const resetForgotFlow = () => {
    setForgotStep("none");
    setForgotOtp("");
    setTimer(0);
    setNewPass("");
    setConfirmPass("");
    setResetToken("");
    setNotice(null);
  };

  const resetOtpLoginFlow = () => {
    setAuthStep("credentials");
    setLoginOtp("");
    setOtpTimer(0);
    setNotice(null);
  };

  const tabBtn = (active: boolean) =>
    [
      "relative z-10 w-1/2 rounded-full py-2.5 text-sm font-semibold transition",
      active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
    ].join(" ");

  // ── Shared post-login handler ────────────────────────────────────────────
  // Both password login and OTP login return the same three relevant flags:
  //   - 2fa_setup_required: true  → user has no 2FA configured yet; show the
  //                                  forced setup wizard (QR + confirm).
  //   - requires_2fa: true        → 2FA is already configured; user must
  //                                  verify with an authenticator code or a
  //                                  recovery code before continuing.
  //   - neither                   → fully authenticated, proceed as normal.
  // In all three cases the token/user returned by login are dispatched first
  // (the 2FA-gated cases use a short-lived limited token that the verify/
  // confirm/recovery endpoints exchange for a full session token).
  const handleAuthSuccess = (res: any, successMessage?: string) => {
    const token =
      res?.data?.token || res?.token || res?.access_token || res?.data?.access_token;
    const user = res?.data?.user || res?.user;

    if (!token || !user) {
      setNotice({
        type: "error",
        text: "Login succeeded but token or user data was not returned by API.",
      });
      triggerShake();
      return;
    }

    dispatch(setAuth({ token, user }));

    const setupRequired = res?.data?.["2fa_setup_required"] === true;
    const requires2FA = res?.data?.["requires_2fa"] === true;

    if (setupRequired) {
      setForce2FASetupOpen(true);
      return;
    }

    if (requires2FA) {
      setRequire2FAVerifyOpen(true);
      return;
    }

    if (successMessage) {
      setNotice({ type: "success", text: successMessage });
    }
    setSuccessOpen(true);
  };

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      loginApi({ ...payload, device_name: deviceName }),

    onMutate: () => {
      setNotice(null);
    },

    onSuccess: (res: any) => handleAuthSuccess(res),

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const forgotSendMutation = useMutation({
    mutationFn: (email: string) => forgotPasswordApi({ email }),

    onMutate: () => setNotice(null),

    onSuccess: (res: any) => {
      startTimer(60);
      setForgotStep("otp");
      setNotice({
        type: "success",
        text:
          res?.message || "If this email is registered, an OTP has been sent.",
      });
    },

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const forgotVerifyMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) =>
      verifyOtpApi(payload),

    onMutate: () => setNotice(null),

    onSuccess: (res: any) => {
      const token = res?.data?.reset_token;

      if (!token) {
        setNotice({
          type: "error",
          text: "OTP verified but reset token not returned.",
        });
        triggerShake();
        return;
      }

      setResetToken(token);
      setForgotStep("reset");
      setNotice({
        type: "success",
        text: res?.message || "OTP verified. You may reset your password.",
      });
    },

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const resetPassMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      token: string;
      password: string;
      password_confirmation: string;
    }) => resetPasswordApi(payload),

    onMutate: () => setNotice(null),

    onSuccess: (res: any) => {
      setNotice({
        type: "success",
        text:
          res?.message || "Password reset successfully. Please login again.",
      });

      resetForgotFlow();
    },

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const otpSendMutation = useMutation({
    mutationFn: (email: string) => sendLoginOtpApi({ email }),

    onMutate: () => setNotice(null),

    onSuccess: (res: any) => {
      startOtpTimer(60);
      setAuthStep("otp");
      setNotice({
        type: "success",
        text:
          res?.message ||
          "If this email is registered, a 6-digit login code has been sent.",
      });
    },

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const otpVerifyMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) =>
      verifyLoginOtpApi({ ...payload, device_name: deviceName }),

    onMutate: () => setNotice(null),

    onSuccess: (res: any) =>
      handleAuthSuccess(res, res?.message || "Login successful"),

    onError: (err) => {
      setNotice({ type: "error", text: getErrMsg(err) });
      triggerShake();
    },
  });

  const loading =
    loginMutation.isPending ||
    forgotSendMutation.isPending ||
    forgotVerifyMutation.isPending ||
    resetPassMutation.isPending ||
    otpSendMutation.isPending ||
    otpVerifyMutation.isPending;

  const handleGetStarted = () => {
    setSuccessOpen(false);
    const destination = savedModuleDestination();
    dispatch(setActiveModuleId(destination.id));
    router.replace(destination.path);
  };

  const NoticeBlock = () =>
    notice ? (
      <div
        className={[
          "rounded-xl border px-4 py-3 text-sm",
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-700",
        ].join(" ")}
      >
        {notice.text}
      </div>
    ) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-indigo-50 to-sky-50">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <LoginSuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        onPrimary={handleGetStarted}
      />

      <TwoFactorSetupModal
        open={force2FASetupOpen}
        onComplete={() => {
          setForce2FASetupOpen(false);
          setNotice({
            type: "success",
            text: "Two-factor authentication is now active on your account.",
          });
          setSuccessOpen(true);
        }}
      />

      <TwoFactorVerifyModal
        open={require2FAVerifyOpen}
        onComplete={() => {
          setRequire2FAVerifyOpen(false);
          setNotice({ type: "success", text: "Verification successful." });
          setSuccessOpen(true);
        }}
      />

      <main className="relative mx-auto flex min-h-screen max-w-[95%] items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-[95%] grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="h-[90vh] hidden lg:block">
            <div className="relative h-full overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-2xl sm:p-8">
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <span className="text-sm font-extrabold">F</span>
                    </div>

                    <div>
                      <div className="text-sm font-semibold leading-none">
                        Flexi HRMS
                      </div>
                      <div className="mt-1 text-[11px] text-white/70">
                        TimeSync • LeaveEase • PayEdge
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <a href="#" className="hover:text-white">
                      Help
                    </a>
                    <a href="#" className="hover:text-white">
                      Privacy
                    </a>
                  </div>
                </div>

                <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Trusted by factories & enterprises
                </div>

                <h1 className="mt-5 text-2xl font-semibold leading-tight sm:text-3xl lg:text-[34px]">
                  Welcome to Flexi — your HR <br className="hidden sm:block" />
                  Ground Zero
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-white/70 sm:text-[15px]">
                  Fast, secure access to TimeSync, LeaveEase, PayEdge and more.
                  Built for high-volume HR ops with granular policies.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FeatureCard
                    title="Face & geo-attendance"
                    desc="Secure device + location validations."
                  />
                  <FeatureCard
                    title="Shift & Overtime"
                    desc="Policies, rules, and auto calc."
                  />
                  <FeatureCard
                    title="Tasks & Approvals"
                    desc="Smart escalations & SLA."
                  />
                  <FeatureCard
                    title="Insights360"
                    desc="Dashboards & anomalies in one place."
                  />
                </div>

                <div className="mt-7 hidden xxl:grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Stat k="30k+" v="Employees" />
                  <Stat k="120+" v="Sites" />
                  <Stat k="99.9%" v="Uptime" />
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex -space-x-2">
                      {["a1.jpeg", "a2.jpeg", "a3.jpeg", "a4.jpeg", "a5.jpeg"].map((n) => (
                        <div
                          key={n}
                          className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-primary bg-white/10"
                        >
                          <Image
                            src={`/avatars/${n}`}
                            alt={`Avatar ${n}`}
                            fill
                            className="object-cover"
                            sizes="36px"
                            unoptimized={true}
                          
                          />
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-white/70">
                      <span className="font-semibold text-white">
                        SOC2-ready
                      </span>{" "}
                      • ISO-27001 aligned
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="h-[90vh]">
            <div className="flex h-full items-center">
              <div
                className={[
                  "relative mx-auto w-full rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-slate-200/60 backdrop-blur sm:p-10",
                  "h-full flex flex-col justify-center",
                  shake ? "animate-shake" : "",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-3xl bg-secondary/30 blur-2xl" />

                <div className="mb-6 flex items-center justify-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <span className="text-sm font-extrabold">F</span>
                  </div>

                  <div className="text-start">
                    <div className="text-sm font-semibold text-slate-900">
                      Flexi HRMS
                    </div>
                    <div className="text-xs text-slate-500">
                      Sign in to your dashboard
                    </div>
                  </div>
                </div>

                <h2 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Hi, Welcome
                </h2>

                <p className="mt-1 text-center text-sm text-slate-500">
                  Please login to HR dashboard
                </p>

                {forgotStep === "none" && (
                  <div className="mx-auto mt-6 w-full max-w-md rounded-full bg-slate-100 p-1">
                    <div className="relative flex">
                      <motion.div
                        className="absolute left-1 top-0.75 h-[calc(100%-6px)] w-[calc(50%-4px)] rounded-full bg-white shadow-sm"
                        animate={{ x: mode === "password" ? 0 : "100%" }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setMode("password");
                          resetOtpLoginFlow();
                        }}
                        className={tabBtn(mode === "password")}
                      >
                        Password
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode("otp");
                          resetOtpLoginFlow();
                        }}
                        className={tabBtn(mode === "otp")}
                      >
                        One-Time Code
                      </button>
                    </div>
                  </div>
                )}

                <div className="mx-auto mt-6 w-full max-w-md">
                  <AnimatePresence mode="wait">
                    {forgotStep !== "none" ? (
                      <motion.div
                        key={`forgot-${forgotStep}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Forgot Password
                            </div>
                            <div className="text-xs text-slate-500">
                              {forgotStep === "email" &&
                                "Enter your email to get a code"}
                              {forgotStep === "otp" && "Enter the 6-digit code"}
                              {forgotStep === "reset" && "Set a new password"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={resetForgotFlow}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                          >
                            Back to login
                          </button>
                        </div>

                        <NoticeBlock />

                        {forgotStep === "email" && (
                          <form
                            className="space-y-4"
                            onSubmit={(e) => {
                              e.preventDefault();

                              const email = forgotEmail.trim();

                              if (!email) {
                                triggerShake();
                                return;
                              }

                              forgotSendMutation.mutate(email);
                            }}
                          >
                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Email
                              </label>

                              <div className="mt-1">
                                <input
                                  type="email"
                                  value={forgotEmail}
                                  onChange={(e) =>
                                    setForgotEmail(e.target.value)
                                  }
                                  placeholder="Input your email"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                            >
                              <span className="inline-flex items-center justify-center gap-2">
                                {forgotSendMutation.isPending && (
                                  <ButtonSpinner />
                                )}
                                {forgotSendMutation.isPending
                                  ? "Sending..."
                                  : "Send OTP"}
                              </span>
                            </button>
                          </form>
                        )}

                        {forgotStep === "otp" && (
                          <form
                            className="space-y-4"
                            onSubmit={(e) => {
                              e.preventDefault();

                              if (forgotOtp.length !== 6) {
                                triggerShake();
                                return;
                              }

                              forgotVerifyMutation.mutate({
                                email: forgotEmail.trim(),
                                otp: forgotOtp,
                              });
                            }}
                          >
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="text-xs text-slate-500">
                                Code sent to{" "}
                                <span className="font-semibold text-slate-900">
                                  {forgotEmail}
                                </span>
                              </div>

                              <div className="mt-3 flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={forgotOtp}
                                  onChange={setForgotOtp}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                  </InputOTPGroup>

                                  <InputOTPSeparator />

                                  <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>

                              <div className="mt-3 flex items-center justify-between text-xs">
                                {timer > 0 ? (
                                  <span className="text-slate-500">
                                    Resend in{" "}
                                    <span className="font-semibold text-slate-900">
                                      {timer}s
                                    </span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const email = forgotEmail.trim();

                                      if (!email) {
                                        triggerShake();
                                        return;
                                      }

                                      forgotSendMutation.mutate(email);
                                    }}
                                    disabled={loading}
                                    className="font-semibold text-primary hover:opacity-90 disabled:opacity-60"
                                  >
                                    {forgotSendMutation.isPending
                                      ? "Sending..."
                                      : "Resend code"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setForgotStep("email");
                                    setForgotOtp("");
                                    setTimer(0);
                                    setNotice(null);
                                  }}
                                  className="font-semibold text-slate-500 hover:text-slate-700"
                                >
                                  Change email
                                </button>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                            >
                              <span className="inline-flex items-center justify-center gap-2">
                                {forgotVerifyMutation.isPending && (
                                  <ButtonSpinner />
                                )}
                                {forgotVerifyMutation.isPending
                                  ? "Verifying..."
                                  : "Verify OTP"}
                              </span>
                            </button>
                          </form>
                        )}

                        {forgotStep === "reset" && (
                          <form
                            className="space-y-4"
                            onSubmit={(e) => {
                              e.preventDefault();

                              if (!resetToken) {
                                triggerShake();
                                return;
                              }

                              if (
                                !newPass ||
                                newPass.length < 8 ||
                                newPass !== confirmPass
                              ) {
                                triggerShake();
                                return;
                              }

                              resetPassMutation.mutate({
                                email: forgotEmail.trim(),
                                token: resetToken,
                                password: newPass,
                                password_confirmation: confirmPass,
                              });
                            }}
                          >
                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                New Password
                              </label>

                              <div className="mt-1">
                                <input
                                  type="password"
                                  value={newPass}
                                  onChange={(e) => setNewPass(e.target.value)}
                                  placeholder="New password"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Confirm Password
                              </label>

                              <div className="mt-1">
                                <input
                                  type="password"
                                  value={confirmPass}
                                  onChange={(e) =>
                                    setConfirmPass(e.target.value)
                                  }
                                  placeholder="Confirm password"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                />
                              </div>

                              {newPass &&
                                confirmPass &&
                                newPass !== confirmPass && (
                                  <div className="mt-2 text-xs text-red-500">
                                    Passwords do not match
                                  </div>
                                )}
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                            >
                              <span className="inline-flex items-center justify-center gap-2">
                                {resetPassMutation.isPending && (
                                  <ButtonSpinner />
                                )}
                                {resetPassMutation.isPending
                                  ? "Updating..."
                                  : "Update Password"}
                              </span>
                            </button>
                          </form>
                        )}

                        <p className="pt-3 text-center text-xs text-slate-400">
                          © {new Date().getFullYear()} Flexi HRMS. All rights
                          reserved.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`login-${mode}-${authStep}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                      >
                        {mode === "password" && (
                          <form
                            className="space-y-4"
                            onSubmit={(e) => {
                              e.preventDefault();
                              setNotice(null);

                              const fd = new FormData(e.currentTarget);
                              const email = String(
                                fd.get("email") || ""
                              ).trim();
                              const password = String(fd.get("password") || "");

                              if (!email || password.length < 6) {
                                triggerShake();
                                setNotice({
                                  type: "error",
                                  text: "Please enter valid email and password.",
                                });
                                return;
                              }

                              loginMutation.mutate({ email, password });
                            }}
                          >
                            <NoticeBlock />

                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Email
                              </label>

                              <div className="mt-1">
                                <input
                                  name="email"
                                  type="email"
                                  defaultValue={demoEmail}
                                  placeholder="Input your email"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Password
                              </label>

                              <div className="relative mt-1">
                                <input
                                  name="password"
                                  type={showPass ? "text" : "password"}
                                  defaultValue={demoPass}
                                  placeholder="Password"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPass((s) => !s)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                                >
                                  {showPass ? "Hide" : "Show"}
                                </button>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                            >
                              <span className="inline-flex items-center justify-center gap-2">
                                {loginMutation.isPending ? (
                                  <ButtonSpinner />
                                ) : (
                                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                                )}

                                {loginMutation.isPending
                                  ? "Logging in..."
                                  : btnText}

                                {!loginMutation.isPending && (
                                  <span className="opacity-0 transition group-hover:opacity-100">
                                    →
                                  </span>
                                )}
                              </span>
                            </button>

                            <div className="flex items-center justify-between pt-1 text-sm">
                              <label className="flex items-center gap-2 text-slate-500">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                />
                                Remember me
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  setForgotEmail(demoEmail);
                                  setForgotStep("email");
                                  setNotice(null);
                                }}
                                className="font-medium text-primary hover:opacity-90"
                              >
                                Forgot Password?
                              </button>
                            </div>

                            <p className="pt-3 text-center text-xs text-slate-400">
                              © {new Date().getFullYear()} Flexi HRMS. All
                              rights reserved.
                            </p>
                          </form>
                        )}

                        {mode === "otp" && (
                          <>
                            {authStep === "credentials" ? (
                              <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                  e.preventDefault();

                                  const email = otpEmail.trim();

                                  if (!email) {
                                    triggerShake();
                                    return;
                                  }

                                  otpSendMutation.mutate(email);
                                }}
                              >
                                <NoticeBlock />

                                <div>
                                  <label className="text-xs font-medium text-slate-600">
                                    Email
                                  </label>

                                  <div className="mt-1">
                                    <input
                                      type="email"
                                      value={otpEmail}
                                      onChange={(e) =>
                                        setOtpEmail(e.target.value)
                                      }
                                      placeholder="Input your email"
                                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/25"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                                >
                                  <span className="inline-flex items-center justify-center gap-2">
                                    {otpSendMutation.isPending && (
                                      <ButtonSpinner />
                                    )}

                                    {otpSendMutation.isPending
                                      ? "Sending..."
                                      : "Send Code"}
                                  </span>
                                </button>

                                <p className="pt-3 text-center text-xs text-slate-400">
                                  © {new Date().getFullYear()} Flexi HRMS. All
                                  rights reserved.
                                </p>
                              </form>
                            ) : (
                              <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                  e.preventDefault();

                                  if (loginOtp.length !== 6) {
                                    triggerShake();
                                    return;
                                  }

                                  otpVerifyMutation.mutate({
                                    email: otpEmail.trim(),
                                    otp: loginOtp,
                                  });
                                }}
                              >
                                <NoticeBlock />

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="text-xs text-slate-500">
                                    Code sent to{" "}
                                    <span className="font-semibold text-slate-900">
                                      {otpEmail}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex justify-center">
                                    <InputOTP
                                      maxLength={6}
                                      value={loginOtp}
                                      onChange={setLoginOtp}
                                    >
                                      <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                      </InputOTPGroup>

                                      <InputOTPSeparator />

                                      <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                      </InputOTPGroup>
                                    </InputOTP>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between text-xs">
                                    {otpTimer > 0 ? (
                                      <span className="text-slate-500">
                                        Resend in{" "}
                                        <span className="font-semibold text-slate-900">
                                          {otpTimer}s
                                        </span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const email = otpEmail.trim();

                                          if (!email) {
                                            triggerShake();
                                            return;
                                          }

                                          otpSendMutation.mutate(email);
                                        }}
                                        disabled={loading}
                                        className="font-semibold text-primary hover:opacity-90 disabled:opacity-60"
                                      >
                                        {otpSendMutation.isPending
                                          ? "Sending..."
                                          : "Resend code"}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        resetOtpLoginFlow();
                                        setOtpEmail(otpEmail.trim());
                                        setNotice(null);
                                      }}
                                      className="font-semibold text-slate-500 hover:text-slate-700"
                                    >
                                      Change email
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="group h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                                >
                                  <span className="inline-flex items-center justify-center gap-2">
                                    {otpVerifyMutation.isPending && (
                                      <ButtonSpinner />
                                    )}

                                    {otpVerifyMutation.isPending
                                      ? "Verifying..."
                                      : "Verify Code"}
                                  </span>
                                </button>

                                <p className="pt-3 text-center text-xs text-slate-400">
                                  © {new Date().getFullYear()} Flexi HRMS. All
                                  rights reserved.
                                </p>
                              </form>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
