"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Award, Download, Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { engageBoardRecognitionsService } from "@/services/engageboard-recognitions.service";
import type { EmployeeRecognition } from "@/types/engageboard-recognitions.types";

/**
 * <RecognitionCard/> — 03-design-system.md §4: leads with the badge/points
 * payoff, similar density to <FeedPost/>.
 *
 * Certificate download: GET /engageboard/recognitions/{uuid}/certificate
 * streams a raw PDF behind auth:sanctum (RecognitionController::certificate()),
 * so it's fetched as a blob through the authenticated axios client and saved
 * via a short-lived object URL — a plain <a href> would carry no bearer token
 * and 401.
 */
export function RecognitionCard({ recognition }: { recognition: EmployeeRecognition }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      const blob = await engageBoardRecognitionsService.downloadCertificate(recognition.uuid);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recognition-certificate-${recognition.uuid}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const when = recognition.recognized_at
    ? new Date(recognition.recognized_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-800">
          <Award className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-brand-900">{recognition.given_by.name}</span>
            {" recognized "}
            <span className="font-semibold text-brand-900">{recognition.recipient.name}</span>
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {recognition.badge ? (
              <Badge className="gap-1 bg-brand-500/15 text-brand-800 hover:bg-brand-500/15">
                <Sparkles className="h-3 w-3" />
                {recognition.badge.name}
              </Badge>
            ) : null}
            <Badge variant="outline" className="tabular-nums">
              +{recognition.points_gifted} pts
            </Badge>
            {recognition.visibility === "private" && (
              <Badge variant="outline" className="gap-1 text-gray-500">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
            {when && <span className="text-xs text-gray-400">{when}</span>}
          </div>

          <p className="mt-2 text-sm text-gray-600">{recognition.reason_message}</p>

          {recognition.certificate_generated && (
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadCertificate}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              {downloading ? "Downloading…" : "Download certificate"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
