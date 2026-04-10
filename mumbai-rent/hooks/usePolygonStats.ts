"use client";

import { useCallback, useState } from "react";
import type { Filters, PolygonStats } from "@/lib/types";

interface StatsState {
  loading: boolean;
  data: PolygonStats | null;
  error: string | null;
}

interface UsePolygonStatsResult {
  stats: PolygonStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (
    polygon: GeoJSON.Polygon,
    filters?: Pick<Filters, "bhk" | "furnishing" | "gated">
  ) => Promise<PolygonStats | null>;
  clearStats: () => void;
}

export function usePolygonStats(): UsePolygonStatsResult {
  const [state, setState] = useState<StatsState>({
    loading: false,
    data: null,
    error: null,
  });

  const fetchStats = useCallback(
    async (
      polygon: GeoJSON.Polygon,
      filters?: Pick<Filters, "bhk" | "furnishing" | "gated">
    ) => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const response = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            polygon,
            filters: {
              bhk: filters?.bhk ?? null,
              furnishing: filters?.furnishing ?? null,
              gated: filters?.gated ?? null,
            },
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to fetch polygon stats");
        }

        const payload = (await response.json()) as PolygonStats;
        setState({ loading: false, data: payload, error: null });
        return payload;
      } catch (error) {
        setState({
          loading: false,
          data: null,
          error: error instanceof Error ? error.message : "Unexpected error",
        });
        return null;
      }
    },
    []
  );

  const clearStats = useCallback(() => {
    setState({ loading: false, data: null, error: null });
  }, []);

  return {
    stats: state.data,
    loading: state.loading,
    error: state.error,
    fetchStats,
    clearStats,
  };
}
