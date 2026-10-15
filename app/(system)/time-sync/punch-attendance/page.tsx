"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  Camera,
  Wifi,
  QrCode,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Laptop,
  Shield,
  Activity,
  ArrowRight,
  Zap,
  RefreshCw,
  User,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BiometricTerminal {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
}

interface PunchEntry {
  id: string;
  method: string;
  time: string;
}

// ─────────────────────────────────────────────
// Simulated APIs
// ─────────────────────────────────────────────
const checkGeofence = async (): Promise<{ distance: number; within: boolean }> => {
  await new Promise((r) => setTimeout(r, 800));
  const outside = Math.random() < 0.3;
  return { distance: outside ? 250 : 15, within: !outside };
};

const captureSelfie = async (): Promise<boolean> => {
  await new Promise((r) => setTimeout(r, 1600));
  return true;
};

const getCurrentIP = async (): Promise<string> => {
  await new Promise((r) => setTimeout(r, 400));
  return "192.168.1.142";
};

const scanQR = async (): Promise<boolean> => {
  await new Promise((r) => setTimeout(r, 1000));
  return true;
};

const punchAtTerminal = async (_id: string): Promise<boolean> => {
  await new Promise((r) => setTimeout(r, 900));
  return true;
};

const webPunch = async (_ip: string): Promise<boolean> => {
  await new Promise((r) => setTimeout(r, 600));
  return true;
};

// ─────────────────────────────────────────────
// SVG Clock Ring
// ─────────────────────────────────────────────
function ClockRing({ seconds }: { seconds: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (seconds / 60) * circ;
  const angle = (seconds / 60) * 2 * Math.PI;
  const dotX = 44 + r * Math.sin(angle);
  const dotY = 44 - r * Math.cos(angle);

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r={r} stroke="#E2E0EE" strokeWidth="3" />
      <circle
        cx="44"
        cy="44"
        r={r}
        stroke="#3E3B6F"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.5s linear" }}
      />
      <circle cx={dotX} cy={dotY} r="4" fill="#EEC293" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Method Card
// ─────────────────────────────────────────────
function MethodCard({
  onClick,
  disabled,
  children,
  accentClass,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  accentClass: string;
}) {
  return (
    <motion.div
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden shadow-sm transition-all
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-slate-300 hover:shadow-md"
        }`}
    >
      {/* Top accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${accentClass}`} />
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function PunchAttendancePage() {
  const [now, setNow] = useState(new Date());
  const [geofence, setGeofence] = useState<{ distance: number; within: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activePunch, setActivePunch] = useState<string | null>(null);
  const [punchLog, setPunchLog] = useState<PunchEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Init
  useEffect(() => {
    setLoading(true);
    checkGeofence().then((d) => {
      setGeofence(d);
      setLoading(false);
    });
    getCurrentIP().then(setIpAddress);
  }, []);

  const refreshGeofence = useCallback(async () => {
    setRefreshing(true);
    const d = await checkGeofence();
    setGeofence(d);
    setRefreshing(false);
  }, []);

  const addLog = (method: string) => {
    setPunchLog((prev) => [
      {
        id: `${Date.now()}`,
        method,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev.slice(0, 4),
    ]);
  };

  // ── Handlers ──
  const handleLocationPunch = useCallback(() => {
    if (!geofence?.within) {
      toast.error("Outside geofence — use Selfie Punch or request an exception.");
      return;
    }
    setActivePunch("location");
    setTimeout(() => {
      setActivePunch(null);
      addLog("Location GPS");
      toast.success("Location punch recorded ✓");
    }, 900);
  }, [geofence]);

  const handleSelfiePunch = useCallback(async () => {
    setShowSelfieModal(true);
    await captureSelfie();
    setShowSelfieModal(false);
    addLog("Selfie Capture");
    toast.success("Identity verified — selfie punch recorded ✓");
  }, []);

  const handleWebPunch = useCallback(async () => {
    if (!ipAddress) return;
    setActivePunch("web");
    await webPunch(ipAddress);
    setActivePunch(null);
    addLog("Web (IP verified)");
    toast.success(`Web punch recorded from ${ipAddress} ✓`);
  }, [ipAddress]);

  const handleBiometricPunch = useCallback(async (terminalId: string, name: string) => {
    setActivePunch(terminalId);
    await punchAtTerminal(terminalId);
    setActivePunch(null);
    addLog(`Biometric — ${name}`);
    toast.success(`Biometric punch at ${name} recorded ✓`);
  }, []);

  const handleQrScan = useCallback(async () => {
    setShowQrModal(true);
    await scanQR();
    setShowQrModal(false);
    addLog("QR Code Scan");
    toast.success("QR punch recorded ✓");
  }, []);

  const requestException = useCallback(() => {
    toast.success("Exception request submitted — HR will contact you shortly.");
  }, []);

  const terminals: BiometricTerminal[] = [
    { id: "dev1", name: "Main Entrance", location: "Ground Floor", status: "online" },
    { id: "dev2", name: "Back Gate", location: "Ground Floor", status: "online" },
  ];

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-[#3E3B6F] animate-spin" />
        <p className="text-xs text-slate-400 tracking-widest uppercase">Checking geofence…</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Toast config ── */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "inherit",
            fontSize: "13px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            color: "#1e293b",
          },
          success: {
            iconTheme: { primary: "#3E3B6F", secondary: "#fff" },
          },
        }}
      />

      {/* ── Page wrapper — layout is already provided ── */}
      <div className="p-6 md:p-8 lg:p-10 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-start justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3E3B6F] flex items-center justify-center shadow-lg shadow-[#3E3B6F]/20">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight tracking-tight">
                  Punch Attendance
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a verification method to record your presence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">System Online</span>
            </div>
          </motion.div>

          {/* ── Clock + Geo row ── */}
          <div className="grid grid-cols-1 md:grid-cols-[192px_1fr] gap-4">

            {/* Clock card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center gap-3"
            >
              <div className="relative">
                <ClockRing seconds={now.getSeconds()} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-[15px] font-bold text-slate-800 leading-none tabular-nums">
                    {timeStr}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-700">{dateStr}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                  <Clock size={9} /> Server Time · PKT
                </p>
              </div>
            </motion.div>

            {/* User + Geo card */}
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              {/* User row */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-[#3E3B6F]/10 border border-[#3E3B6F]/20 flex items-center justify-center font-bold text-sm text-[#3E3B6F] shrink-0">
                  AK
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">Ahmed Khan</p>
                  <p className="text-xs text-slate-400 mt-0.5">Software Engineer · EMP-4821</p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0
                    ${geofence?.within
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse
                      ${geofence?.within ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {geofence?.within ? "In Zone" : "Out of Zone"}
                </div>
              </div>

              {/* Geo bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={12}
                      className={geofence?.within ? "text-emerald-500" : "text-amber-500"}
                    />
                    <span className="text-xs font-medium text-slate-600">Office HQ Geofence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold
                        ${geofence?.within ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {geofence?.distance}m {geofence?.within ? "inside" : "outside"}
                    </span>
                    <button
                      onClick={refreshGeofence}
                      className="text-slate-400 hover:text-[#3E3B6F] transition-colors"
                      title="Refresh location"
                    >
                      <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: geofence?.within
                        ? `${Math.max(10, 100 - (geofence.distance / 300) * 100)}%`
                        : `${Math.min(100, (1000/ 300) * 100)}%`,
                    }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`h-full rounded-full
                      ${geofence?.within
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-amber-400 to-amber-500"
                      }`}
                  />
                </div>

                {!geofence?.within && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200"
                  >
                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      You&apos;re <strong>{geofence?.distance}m</strong> outside the designated zone.
                      Use <strong>Selfie Punch</strong> or request an exception for remote attendance.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Section divider ── */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-slate-400">
              Verification Methods
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── 2×2 Method Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* 1 · Location GPS */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.16 }}
            >
              <MethodCard
                onClick={handleLocationPunch}
                disabled={!geofence?.within || activePunch === "location"}
                accentClass="bg-gradient-to-r from-emerald-400 to-emerald-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <MapPin size={20} className="text-emerald-600" />
                  </div>
                  {geofence?.within ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-800 text-sm mb-1">Location GPS</p>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Verify using device GPS within the office geofence boundary
                </p>

                <button
                  tabIndex={-1}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all
                    ${geofence?.within && activePunch !== "location"
                      ? "bg-[#3E3B6F] text-white hover:bg-[#2C2A4A] shadow-sm shadow-[#3E3B6F]/25"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {activePunch === "location" ? (
                    <><RefreshCw size={12} className="animate-spin" /> Recording…</>
                  ) : (
                    <>Record Punch <ArrowRight size={12} /></>
                  )}
                </button>
              </MethodCard>
            </motion.div>

            {/* 2 · Selfie Punch */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <MethodCard
                onClick={handleSelfiePunch}
                accentClass="bg-gradient-to-r from-[#EEC293] to-[#E4B97A]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EEC293]/10 border border-[#EEC293]/25 flex items-center justify-center">
                    <Camera size={20} className="text-[#EEC293]" />
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#EEC293] bg-[#EEC293]/10 border border-[#EEC293]/25 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} /> Available
                  </span>
                </div>

                <p className="font-bold text-slate-800 text-sm mb-1">Selfie Punch</p>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Capture a live selfie for facial recognition identity verification
                </p>

                <button
                  tabIndex={-1}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#EEC293] text-white hover:bg-[#B8893A] shadow-sm shadow-[#EEC293]/25 transition-all"
                >
                  Open Camera <ArrowRight size={12} />
                </button>
              </MethodCard>
            </motion.div>

            {/* 3 · Web Punch */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.24 }}
            >
              <MethodCard
                onClick={handleWebPunch}
                disabled={activePunch === "web"}
                accentClass="bg-gradient-to-r from-sky-400 to-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                    <Laptop size={20} className="text-sky-500" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    <Wifi size={9} />
                    {ipAddress ?? "Detecting…"}
                  </div>
                </div>

                <p className="font-bold text-slate-800 text-sm mb-1">Web Punch</p>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Verify from your workstation IP address on the corporate network
                </p>

                <button
                  tabIndex={-1}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all
                    ${activePunch === "web"
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300"
                    }`}
                >
                  {activePunch === "web" ? (
                    <><RefreshCw size={12} className="animate-spin" /> Verifying…</>
                  ) : (
                    <>Punch via IP <ArrowRight size={12} /></>
                  )}
                </button>
              </MethodCard>
            </motion.div>

            {/* 4 · QR Scanner */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.28 }}
            >
              <MethodCard
                onClick={handleQrScan}
                accentClass="bg-gradient-to-r from-violet-400 to-purple-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                    <QrCode size={20} className="text-violet-500" />
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                    <Zap size={9} /> Quick Scan
                  </span>
                </div>

                <p className="font-bold text-slate-800 text-sm mb-1">QR Scanner</p>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Scan the QR code displayed at designated entry checkpoints
                </p>

                <button
                  tabIndex={-1}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all"
                >
                  Open Scanner <ArrowRight size={12} />
                </button>
              </MethodCard>
            </motion.div>
          </div>

          {/* ── Biometric + Activity Log ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Biometric Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.32 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <Fingerprint size={18} className="text-rose-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">Biometric Terminal</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Required by site policy</p>
                </div>
              </div>

              <div className="space-y-2">
                {terminals.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => handleBiometricPunch(term.id, term.name)}
                    disabled={activePunch === term.id}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200
                      hover:border-[#3E3B6F]/30 hover:bg-[#3E3B6F]/[0.03] transition-all group text-left
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#3E3B6F]/10 flex items-center justify-center transition-colors">
                        <Fingerprint
                          size={14}
                          className={
                            activePunch === term.id
                              ? "text-[#EEC293] animate-pulse"
                              : "text-slate-400 group-hover:text-[#3E3B6F]"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{term.name}</p>
                        <p className="text-[10px] text-slate-400">{term.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border
                          ${term.status === "online"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full
                            ${term.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                        />
                        {term.status}
                      </div>
                      {activePunch === term.id ? (
                        <RefreshCw size={13} className="text-[#EEC293] animate-spin" />
                      ) : (
                        <ChevronRight size={13} className="text-slate-400 group-hover:text-[#3E3B6F] transition-colors" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#3E3B6F] transition-colors">
                <ExternalLink size={11} /> Report terminal issue
              </button>
            </motion.div>

            {/* Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.36 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#3E3B6F]/8 border border-[#3E3B6F]/15 flex items-center justify-center shrink-0">
                  <Activity size={18} className="text-[#3E3B6F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight">Today&apos;s Activity</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Real-time punch records</p>
                </div>
                {punchLog.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#3E3B6F] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {punchLog.length}
                  </span>
                )}
              </div>

              <div className="min-h-[108px]">
                <AnimatePresence mode="popLayout">
                  {punchLog.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-[100px] border border-dashed border-slate-200 rounded-xl gap-2"
                    >
                      <User size={20} className="text-slate-300" />
                      <p className="text-xs text-slate-400">No punches recorded yet today</p>
                    </motion.div>
                  ) : (
                    punchLog.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#3E3B6F] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {entry.method}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            {entry.time}
                          </span>
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {!geofence?.within && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={requestException}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all"
                >
                  <AlertTriangle size={13} /> Request Remote Exception
                </motion.button>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Selfie Modal ── */}
      <AnimatePresence>
        {showSelfieModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EEC293]/10 border border-[#EEC293]/25 flex items-center justify-center mx-auto mb-4">
                <Camera size={22} className="text-[#EEC293]" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Identity Verification</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Look directly at the camera and keep your face centred in the frame
              </p>

              <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden mb-4">
                {/* Scan line */}
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EEC293] to-transparent [animation:scanline_2s_linear_infinite]" />
                {/* Corner guides */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#EEC293] rounded-tl" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#EEC293] rounded-tr" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#EEC293] rounded-bl" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#EEC293] rounded-br" />
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-600 text-xs">Camera preview</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#EEC293] animate-pulse" />
                Capturing in 1.5s…
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QR Modal ── */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                <QrCode size={22} className="text-violet-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">QR Scanner</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Hold the QR code steady within the scanning frame
              </p>

              <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden mb-4">
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent [animation:scanline_1.6s_linear_infinite]" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-violet-400 rounded-tl" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-violet-400 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-violet-400 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-violet-400 rounded-br" />
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-600 text-xs">Awaiting QR code…</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Scanning…
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline keyframe — one small style tag; Tailwind arbitrary animation syntax doesn't compile without a JIT config */}
      <style>{`
        @keyframes scanline {
          0%   { top: 8%;  opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
      `}</style>
    </>
  );
}