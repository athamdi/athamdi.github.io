"use client";

import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { useMemo, useState } from "react";
import type { Pin } from "@/lib/types";
import { formatRent, timeAgo } from "@/lib/utils";

interface PinMarkerProps {
  pin: Pin;
  onReportSuccess?: () => void;
}

function markerIcon(pin: Pin): string {
  if (pin.verified) return "✓";
  if (pin.pin_type === "seeker") return "🤝";
  if (pin.pin_type === "owner") return "🏠";
  return "₹";
}

function markerColor(pin: Pin): string {
  if (pin.verified) return "#FBBF24";
  if (pin.pin_type === "seeker") return "#10B981";
  if (pin.pin_type === "owner") return "#6366F1";
  return "#F97316";
}

export default function PinMarker({ pin, onReportSuccess }: PinMarkerProps) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const glyph = useMemo(() => markerIcon(pin), [pin]);
  const color = useMemo(() => markerColor(pin), [pin]);

  const handleReport = async (): Promise<void> => {
    setReporting(true);
    setReportError(null);
    try {
      const response = await fetch(`/api/pins/${pin.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report" }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to report pin");
      }

      onReportSuccess?.();
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Failed to report pin");
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <AdvancedMarker position={{ lat: pin.lat, lng: pin.lng }} onClick={() => setOpen(true)}>
        <div
          className="grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold text-white shadow-lg"
          style={{ backgroundColor: color, borderColor: "#0A0F1A" }}
        >
          {glyph}
        </div>
      </AdvancedMarker>

      {open ? (
        <InfoWindow
          position={{ lat: pin.lat, lng: pin.lng }}
          onCloseClick={() => setOpen(false)}
        >
          <div className="max-w-[280px] rounded-lg bg-white p-3 text-slate-700">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">
                {pin.bhk} BHK · {formatRent(pin.rent)}
              </p>
              {pin.verified ? (
                <span className="rounded bg-amber px-2 py-0.5 text-xs font-semibold text-slate-900">
                  Verified
                </span>
              ) : null}
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {pin.furnishing} · {pin.gated ? "Gated" : "Non-Gated"}
            </p>
            {pin.one_liner ? (
              <p className="mt-2 text-sm text-slate-700">"{pin.one_liner}"</p>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{timeAgo(pin.created_at)}</span>
              <button
                type="button"
                onClick={handleReport}
                disabled={reporting}
                className="rounded border border-alert-red px-2 py-1 text-alert-red hover:bg-red-50 disabled:opacity-60"
              >
                {reporting ? "Reporting..." : "Report"}
              </button>
            </div>
            {reportError ? (
              <p className="mt-2 text-xs text-red-600">{reportError}</p>
            ) : null}
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}
