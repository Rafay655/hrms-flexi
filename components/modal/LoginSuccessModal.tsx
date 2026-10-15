"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  onPrimary: () => void;
  primaryText?: string;
};

export default function LoginSuccessModal({
  open,
  onClose,
  onPrimary,
  primaryText = "Get Started",
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center px-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Check */}
              <div className="mx-auto mt-1 grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-400 text-white shadow-sm">
                  ✓
                </div>
              </div>

              <h3 className="mt-5 text-center text-2xl font-semibold text-slate-900">
                Login Successful
              </h3>

              <p className="mt-2 text-center text-sm text-slate-500">
                Let&apos;s get started and take your management business to the next level!
              </p>

              <button
                type="button"
                onClick={onPrimary}
                className="mt-6 h-12 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition hover:brightness-105 active:scale-[0.99]"
              >
                {primaryText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}