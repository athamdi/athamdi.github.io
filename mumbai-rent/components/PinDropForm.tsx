"use client";

import { FormEvent, useMemo, useState } from "react";
import { clsx } from "clsx";
import type { BHK, Furnishing, PinType } from "@/lib/types";
import { formatRent } from "@/lib/utils";
import FlatmateForm from "./FlatmateForm";

interface PinDropFormProps {
  open: boolean;
  initialLatLng: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const bhkOptions: Array<{ label: string; value: BHK }> = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "3+", value: 4 },
];

const furnishingOptions: Array<{ label: string; value: Furnishing }> = [
  { label: "Unfurnished", value: "unfurnished" },
  { label: "Semi", value: "semi" },
  { label: "Fully", value: "fully" },
];

const typeOptions: Array<{ label: string; value: PinType }> = [
  { label: "Rent pin", value: "rent" },
  { label: "Looking for flat", value: "seeker" },
  { label: "Have a spare room", value: "owner" },
];

export default function PinDropForm({
  open,
  initialLatLng,
  onClose,
  onSubmitted,
}: PinDropFormProps) {
  const [bhk, setBhk] = useState<BHK | null>(null);
  const [rent, setRent] = useState<number>(25000);
  const [furnishing, setFurnishing] = useState<Furnishing | null>(null);
  const [gated, setGated] = useState<boolean>(false);
  const [oneLiner, setOneLiner] = useState("");
  const [pinType, setPinType] = useState<PinType>("rent");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rentFormatted = useMemo(() => formatRent(rent), [rent]);

  if (!open || !initialLatLng) return null;

  const validate = (): string | null => {
    if (!bhk) return "BHK is required.";
    if (!furnishing) return "Furnishing is required.";
    if (rent < 1000 || rent > 500000) {
      return "Rent must be between ₹1,000 and ₹5,00,000.";
    }
    if (oneLiner.length > 120) return "One-liner must be 120 characters or less.";
    if ((pinType === "seeker" || pinType === "owner") && !email.trim()) {
      return "Email is required for seeker/owner relay.";
    }
    return null;
  };

  const resetForm = () => {
    setBhk(null);
    setRent(25000);
    setFurnishing(null);
    setGated(false);
    setOneLiner("");
    setPinType("rent");
    setEmail("");
    setError(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: initialLatLng.lat,
          lng: initialLatLng.lng,
          bhk,
          rent,
          furnishing,
          gated,
          one_liner: oneLiner || null,
          pin_type: pinType,
          email: email || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to drop this pin.");
      }

      onSubmitted();
      resetForm();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected submit error."
      );
    } finally {
      setLoading(false);
    }
  };

  const chipBase =
    "rounded-full border px-3 py-1.5 text-sm transition-colors md:px-4 md:py-2";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 md:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-surface p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Drop a Pin</h3>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">BHK</p>
            <div className="flex flex-wrap gap-2">
              {bhkOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBhk(option.value)}
                  className={clsx(
                    chipBase,
                    bhk === option.value
                      ? "border-mumbai-orange bg-mumbai-orange text-white"
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  {option.label === "3+" ? "3BHK+" : `${option.label}BHK`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Rent</p>
            <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-void px-3 py-2">
              <span className="text-slate-300">₹</span>
              <input
                type="number"
                min={1000}
                max={500000}
                value={rent}
                onChange={(event) => setRent(Number(event.target.value))}
                className="w-full bg-transparent text-slate-100 outline-none"
                required
              />
              <span className="font-mono text-xs text-slate-400">{rentFormatted}</span>
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Furnishing</p>
            <div className="flex flex-wrap gap-2">
              {furnishingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFurnishing(option.value)}
                  className={clsx(
                    chipBase,
                    furnishing === option.value
                      ? "border-mumbai-orange bg-mumbai-orange text-white"
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Gated society
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGated(true)}
                className={clsx(
                  chipBase,
                  gated
                    ? "border-mumbai-orange bg-mumbai-orange text-white"
                    : "border-slate-600 text-slate-300"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setGated(false)}
                className={clsx(
                  chipBase,
                  !gated
                    ? "border-mumbai-orange bg-mumbai-orange text-white"
                    : "border-slate-600 text-slate-300"
                )}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Pin type</p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPinType(option.value)}
                  className={clsx(
                    chipBase,
                    pinType === option.value
                      ? "border-mumbai-orange bg-mumbai-orange text-white"
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {(pinType === "seeker" || pinType === "owner") && (
            <FlatmateForm email={email} setEmail={setEmail} />
          )}

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
              One-liner
            </span>
            <input
              type="text"
              value={oneLiner}
              onChange={(event) => setOneLiner(event.target.value)}
              maxLength={120}
              placeholder="What's it actually like?"
              className="w-full rounded-md border border-slate-700 bg-void px-3 py-2 text-sm text-slate-100 outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-mumbai-orange px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Drop this pin →"}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-400">
          No login needed. IP hashed, never stored raw.
        </p>
      </div>
    </div>
  );
}
