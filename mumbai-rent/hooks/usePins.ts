"use client";

import { useCallback, useEffect, useState } from "react";
import type { Pin } from "@/lib/types";

interface UsePinsResult {
  pins: Pin[];
  loading: boolean;
  error: string | null;
  refreshPins: () => Promise<void>;
}

export function usePins(): UsePinsResult {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pins", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to fetch pins");
      }
      const data = (await response.json()) as Pin[];
      setPins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPins();
  }, [refreshPins]);

  return { pins, loading, error, refreshPins };
}
