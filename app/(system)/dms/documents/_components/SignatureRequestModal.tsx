"use client";

/**
 * app/(system)/dms/documents/_components/SignatureRequestModal.tsx
 * DMS — Request E-Signature Modal
 *
 * Props:
 *   documentUuid — UUID of the document to request a signature for
 *   open         — controlled open state
 *   onOpenChange — close handler
 *
 * Flow:
 *   1. User enters the signer's full name and email address
 *   2. Optional signature deadline date
 *   3. Submit → requestSignature(documentUuid, {
 *                 signatories: [{ name, email, sign_order: 1 }],
 *                 expires_at,
 *               })
 *            → toast "Signature OTP sent to the signer's email"
 *            → close
 *
 * Why name + email (not an employee picker): the backend
 * RequestSignatureMultiRequest requires `signatories[].name` and
 * `signatories[].email` (the OTP is delivered to that address). The PeopleHub
 * employees endpoint exposes neither a user_id nor an email, so a manual
 * name + email entry is the only complete, supported path. `user_id` is
 * optional on the backend, so an external (non-account) signer works too.
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *   • All interactive elements have associated labels
 *   • aria-busy on submit button while pending
 *   • aria-required + aria-invalid on the required fields
 */

import { showApiError } from "@/lib/error-toast";
import React, { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { CalendarDays, Loader2, Mail, PenLine, User } from "lucide-react";

import { requestSignature } from "@/services/dms.service";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Pragmatic email check — backend re-validates with the `email` rule. */
const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export interface SignatureRequestModalProps {
  documentUuid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignatureRequestModal({
  documentUuid,
  open,
  onOpenChange,
}: SignatureRequestModalProps) {
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSignerName("");
        setSignerEmail("");
        setExpiresAt("");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // ── Mutation ──────────────────────────────────────────────────────────────

  const sigMutation = useMutation({
    mutationFn: () =>
      requestSignature(documentUuid, {
        signatories: [
          {
            name: signerName.trim(),
            email: signerEmail.trim(),
            sign_order: 1,
          },
        ],
        expires_at: expiresAt || null,
      }),
    onSuccess: () => {
      toast.success("Signature request sent — OTP delivered to the signer's email.");
      handleOpenChange(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to send signature request." });
    },
  });

  const emailValid = isValidEmail(signerEmail);
  const canSubmit =
    signerName.trim() !== "" && emailValid && !sigMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        aria-label="Request e-signature dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" aria-hidden="true" />
            Request Signature
          </DialogTitle>
          <DialogDescription>
            Enter the signer&apos;s name and email and optionally set a deadline.
            The signer will receive a one-time OTP via email to authorise the
            document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Signer name ───────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="sig-signer-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              Signer name{" "}
              <span className="text-red-500 font-normal" aria-label="required">
                *
              </span>
            </Label>
            <Input
              id="sig-signer-name"
              type="text"
              maxLength={100}
              autoComplete="off"
              placeholder="e.g. Ayesha Khan"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* ── Signer email ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="sig-signer-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              Signer email{" "}
              <span className="text-red-500 font-normal" aria-label="required">
                *
              </span>
            </Label>
            <Input
              id="sig-signer-email"
              type="email"
              maxLength={255}
              autoComplete="off"
              placeholder="signer@company.com"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              aria-required="true"
              aria-invalid={signerEmail !== "" && !emailValid}
            />
            {signerEmail !== "" && !emailValid && (
              <p className="text-[11px] text-red-500">
                Enter a valid email address.
              </p>
            )}
          </div>

          {/* ── Signature deadline ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sig-expires-at"
              className="flex items-center gap-1.5"
            >
              <CalendarDays
                className="h-3.5 w-3.5 text-gray-400"
                aria-hidden="true"
              />
              Signature deadline{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </Label>
            <Input
              id="sig-expires-at"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-[11px] text-gray-400">
              If set, the signer&apos;s OTP link expires at midnight on this date.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={sigMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-brand-800 hover:bg-brand-700 text-white"
            onClick={() => sigMutation.mutate()}
            disabled={!canSubmit}
            aria-busy={sigMutation.isPending}
          >
            {sigMutation.isPending ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Sending…
              </>
            ) : (
              <>
                <PenLine className="mr-2 h-4 w-4" aria-hidden="true" />
                Send request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
