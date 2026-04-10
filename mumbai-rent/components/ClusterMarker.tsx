"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";

interface ClusterMarkerProps {
  lat: number;
  lng: number;
  count: number;
  onClick?: () => void;
}

export default function ClusterMarker({ lat, lng, count, onClick }: ClusterMarkerProps) {
  return (
    <AdvancedMarker position={{ lat, lng }} onClick={onClick}>
      <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-mumbai-orange bg-void/90 text-xs font-semibold text-mumbai-orange shadow-lg">
        {count > 99 ? "99+" : count}
      </div>
    </AdvancedMarker>
  );
}
