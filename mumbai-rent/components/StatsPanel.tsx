"use client";

import { formatRent } from "@/lib/utils";
import type { Filters, PolygonStats } from "@/lib/types";

interface StatsPanelProps {
  stats: PolygonStats | null;
  loading: boolean;
  filters: Filters;
  onClear: () => void;
}

function activeFilterChips(filters: Filters): string[] {
  const chips: string[] = [];
  if (filters.bhk) chips.push(`${filters.bhk}BHK`);
  if (filters.furnishing) chips.push(filters.furnishing);
  if (filters.gated === true) chips.push("Gated");
  if (filters.gated === false) chips.push("Non-Gated");
  return chips;
}

export default function StatsPanel({
  stats,
  loading,
  filters,
  onClear,
}: StatsPanelProps) {
  if (!stats && !loading) return null;
  if (!stats && loading) {
    return (
      <aside className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border border-slate-700 bg-surface/95 p-4 backdrop-blur md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:rounded-none md:p-6">
        <p className="text-sm text-slate-300">Calculating area stats…</p>
      </aside>
    );
  }
  if (!stats) return null;

  const chips = activeFilterChips(filters);
  const totalBhk = stats.by_bhk.reduce((sum, item) => sum + item.count, 0);
  const totalFurnishing = stats.by_furnishing.reduce((sum, item) => sum + item.count, 0);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border border-slate-700 bg-surface/95 p-4 backdrop-blur md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:rounded-none md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
            YOUR AREA · {stats.count} pins
          </p>
          <p className="font-playfair text-4xl font-black text-white">
            {formatRent(stats.median_rent)}
          </p>
          <p className="text-sm text-slate-300">
            P25 / P75: {formatRent(stats.p25_rent)} - {formatRent(stats.p75_rent)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Clear area
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-mumbai-orange/40 bg-mumbai-orange/10 px-3 py-1 text-xs capitalize text-mumbai-orange"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {stats.count < 5 ? (
        <div className="rounded-xl border border-slate-700 bg-void/60 p-4 text-sm text-slate-300">
          Not enough pins yet. Be the first to drop one here.
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-slate-400">
              BHK breakdown
            </h3>
            <div className="space-y-2">
              {stats.by_bhk.map((item) => {
                const pct = totalBhk === 0 ? 0 : Math.round((item.count / totalBhk) * 100);
                return (
                  <div key={item.bhk}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>{item.bhk}BHK</span>
                      <span className="font-mono">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-mumbai-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-slate-400">
              Furnishing
            </h3>
            <div className="space-y-2">
              {stats.by_furnishing.map((item) => {
                const pct =
                  totalFurnishing === 0 ? 0 : Math.round((item.count / totalFurnishing) * 100);
                return (
                  <div key={item.type}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span className="capitalize">{item.type}</span>
                      <span className="font-mono">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
