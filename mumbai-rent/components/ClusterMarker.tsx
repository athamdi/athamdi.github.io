"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";

interface ClusterMarkerProps {
  lat: number;
  lng: number;
  count: number;
  onClick?: () => void;
}

export default function ClusterMarker({ lat, lng, count, onClick }: ClusterMarkerProps) {
  const sizeClass =
    count >= 50 ? "h-12 w-12 text-sm" : count >= 15 ? "h-11 w-11 text-xs" : "h-10 w-10 text-xs";

  return (
    <AdvancedMarker position={{ lat, lng }} onClick={onClick}>
      <div
        className={`grid ${sizeClass} place-items-center rounded-full border-2 border-mumbai-orange bg-void/90 font-semibold text-mumbai-orange shadow-lg`}
      >
        {count > 99 ? "99+" : count}
      </div>
    </AdvancedMarker>
  );
}
