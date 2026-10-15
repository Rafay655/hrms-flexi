"use client";

/**
 * _components/SessionRevokeDialog.tsx
 * Confirmation dialog before revoking a session.
 * Used by both the "My Sessions" and "Company Sessions" pages.
 *
 * Props:
 *   open          — controlled open state
 *   onOpenChange  — setter for open state
 *   sessionInfo   — label shown in the body (e.g. "Chrome on Windows · 192.168.1.1")
 *   onConfirm     — async callback; dialog shows a spinner while pending
 *   loading       — external loading flag (from useMutation)
 */

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldOff, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionInfo?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
};

export default function SessionRevokeDialog({
  open,
  onOpenChange,
  sessionInfo,
  onConfirm,
  loading = false,
}: Props) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldOff className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-base font-semibold">
              Revoke Session
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            This will immediately terminate the session
            {sessionInfo ? (
              <>
                {" "}
                for{" "}
                <span className="font-medium text-foreground">
                  {sessionInfo}
                </span>
              </>
            ) : null}
            . The user will be signed out and must log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Revoking…
              </>
            ) : (
              "Revoke Session"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
