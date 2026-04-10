"use client";

import { useState } from "react";
import Map from "@/components/Map";
import FilterBar from "@/components/FilterBar";
import type { Filters } from "@/lib/types";

const initialFilters: Filters = {
  bhk: null,
  furnishing: null,
  gated: null,
  pin_type: null,
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [drawMode, setDrawMode] = useState(false);
  const [requestOpenPinDrop, setRequestOpenPinDrop] = useState(false);
  const [pinCount, setPinCount] = useState(1243);

  return (
    <main className="h-screen bg-void text-slate-300">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-void/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-mumbai-orange font-semibold text-white">
              M
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">mumbai.rent</h1>
              <p className="font-mono text-xs text-slate-400">
                {new Intl.NumberFormat("en-IN").format(pinCount)} real pins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawMode((prev) => !prev)}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-mumbai-orange hover:text-white"
            >
              {drawMode ? "Cancel Draw" : "Draw Area"}
            </button>
            <button
              type="button"
              onClick={() => setRequestOpenPinDrop(true)}
              className="rounded-md bg-mumbai-orange px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-500"
            >
              Drop a Pin
            </button>
          </div>
        </div>
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </header>

      <section className="h-[calc(100vh-108px)]">
        <Map
          filters={filters}
          drawMode={drawMode}
          onToggleDrawMode={() => setDrawMode((prev) => !prev)}
          requestOpenPinDrop={requestOpenPinDrop}
          onConsumePinDropRequest={() => setRequestOpenPinDrop(false)}
          onPinCountChange={setPinCount}
        />
      </section>
    </main>
  );
}
