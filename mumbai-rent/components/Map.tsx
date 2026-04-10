"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMapView,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Filters, Pin } from "@/lib/types";
import { usePins } from "@/hooks/usePins";
import { usePolygonStats } from "@/hooks/usePolygonStats";
import { polygonToGeoJSON } from "@/lib/utils";
import PinDropForm from "./PinDropForm";
import PinMarker from "./PinMarker";
import ClusterMarker from "./ClusterMarker";
import StatsPanel from "./StatsPanel";

interface MapProps {
  filters: Filters;
  drawMode: boolean;
  onToggleDrawMode: () => void;
  requestOpenPinDrop: boolean;
  onConsumePinDropRequest: () => void;
  onPinCountChange?: (count: number) => void;
}

interface ClusterSummary {
  id: string;
  lat: number;
  lng: number;
  count: number;
  sample: Pin;
  pins: Pin[];
}

function matchesFilters(pin: Pin, filters: Filters): boolean {
  if (filters.bhk !== null && pin.bhk !== filters.bhk) return false;
  if (filters.furnishing !== null && pin.furnishing !== filters.furnishing) {
    return false;
  }
  if (filters.gated !== null && pin.gated !== filters.gated) return false;
  if (filters.pin_type !== null && pin.pin_type !== filters.pin_type) return false;
  return true;
}

function useClusters(
  pins: Pin[],
  zoom: number
): { singles: Pin[]; clusters: ClusterSummary[] } {
  return useMemo(() => {
    if (zoom >= 14) return { singles: pins, clusters: [] };

    const cellSize = zoom <= 10 ? 0.024 : zoom <= 12 ? 0.016 : 0.01;
    const buckets = new Map<string, Pin[]>();

    for (const pin of pins) {
      const key = `${Math.floor(pin.lat / cellSize)}:${Math.floor(pin.lng / cellSize)}`;
      const bucket = buckets.get(key) ?? [];
      bucket.push(pin);
      buckets.set(key, bucket);
    }

    const clusters: ClusterSummary[] = [];
    const singles: Pin[] = [];

    for (const [id, bucket] of buckets.entries()) {
      if (bucket.length < 4) {
        singles.push(...bucket);
        continue;
      }
      const lat = bucket.reduce((sum, item) => sum + item.lat, 0) / bucket.length;
      const lng = bucket.reduce((sum, item) => sum + item.lng, 0) / bucket.length;
      clusters.push({
        id,
        lat,
        lng,
        count: bucket.length,
        sample: bucket[0],
        pins: bucket,
      });
    }

    return { singles, clusters };
  }, [pins, zoom]);
}

function MapInner({
  filters,
  drawMode,
  onToggleDrawMode,
  requestOpenPinDrop,
  onConsumePinDropRequest,
  onPinCountChange,
}: MapProps) {
  const map = useMap();
  const { pins, loading, error, refreshPins } = usePins();
  const { stats, loading: statsLoading, error: statsError, fetchStats, clearStats } =
    usePolygonStats();

  const [zoom, setZoom] = useState(11);
  const [dropOpen, setDropOpen] = useState(false);
  const [dropPoint, setDropPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [activeFilters, setActiveFilters] = useState(filters);
  const [activeCluster, setActiveCluster] = useState<ClusterSummary | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  const filteredPins = useMemo(
    () => pins.filter((pin) => matchesFilters(pin, filters)),
    [pins, filters]
  );
  const { singles, clusters } = useClusters(filteredPins, zoom);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    onPinCountChange?.(filteredPins.length);
  }, [filteredPins.length, onPinCountChange]);

  useEffect(() => {
    if (!map) return;
    const zoomListener = map.addListener("zoom_changed", () => {
      setZoom(map.getZoom() ?? 11);
    });
    const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!event.latLng || drawMode) return;
      setDropPoint({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      setDropOpen(true);
    });

    return () => {
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(clickListener);
    };
  }, [map, drawMode]);

  useEffect(() => {
    if (!requestOpenPinDrop) return;
    setDropPoint({ lat: 19.076, lng: 72.8777 });
    setDropOpen(true);
    onConsumePinDropRequest();
  }, [requestOpenPinDrop, onConsumePinDropRequest]);

  useEffect(() => {
    if (!map || !window.google?.maps?.drawing) return;
    if (!drawingManagerRef.current) {
      const manager = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        drawingMode: null,
        polygonOptions: {
          fillColor: "#F97316",
          fillOpacity: 0.15,
          strokeColor: "#F97316",
          strokeWeight: 2,
          clickable: true,
          editable: false,
          draggable: false,
        },
      });
      manager.setMap(map);
      drawingManagerRef.current = manager;

      const listener = google.maps.event.addListener(
        manager,
        "overlaycomplete",
        async (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (event.type !== "polygon") return;

          if (drawnPolygon) drawnPolygon.setMap(null);

          const polygon = event.overlay as google.maps.Polygon;
          setDrawnPolygon(polygon);
          const geojson = polygonToGeoJSON(polygon.getPath().getArray());
          setActiveFilters(filters);
          await fetchStats(geojson, filters);
          manager.setDrawingMode(null);
          onToggleDrawMode();
        }
      );

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, drawnPolygon, fetchStats, filters, onToggleDrawMode]);

  useEffect(() => {
    if (!drawingManagerRef.current) return;
    drawingManagerRef.current.setDrawingMode(
      drawMode ? google.maps.drawing.OverlayType.POLYGON : null
    );
  }, [drawMode]);

  const clearArea = (): void => {
    if (drawnPolygon) {
      drawnPolygon.setMap(null);
      setDrawnPolygon(null);
    }
    clearStats();
  };

  return (
    <>
      {loading && (
        <div className="absolute left-4 top-4 z-20 rounded-full bg-surface/95 px-3 py-1 text-xs text-slate-300 shadow">
          Loading recent pins...
        </div>
      )}
      {error && (
        <div className="absolute left-4 top-4 z-20 rounded-full bg-alert-red/20 px-3 py-1 text-xs text-red-200">
          Could not load pins. Pull to retry.
        </div>
      )}
      {statsError && (
        <div className="absolute left-4 top-14 z-20 rounded-full bg-alert-red/20 px-3 py-1 text-xs text-red-200">
          Failed to fetch polygon stats.
        </div>
      )}

      {clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          lat={cluster.lat}
          lng={cluster.lng}
          count={cluster.count}
          onClick={() => setActiveCluster(cluster)}
        />
      ))}

      {singles.map((pin) => (
        <PinMarker key={pin.id} pin={pin} onReportSuccess={refreshPins} />
      ))}

      {activeCluster && (
        <InfoWindow
          position={{ lat: activeCluster.lat, lng: activeCluster.lng }}
          onCloseClick={() => setActiveCluster(null)}
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              {activeCluster.count} nearby pins
            </div>
            <div className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
              Typical: {activeCluster.sample.bhk}BHK · ₹
              {activeCluster.sample.rent.toLocaleString("en-IN")}
            </div>
            <ul className="max-h-44 space-y-1 overflow-auto text-xs text-slate-600">
              {activeCluster.pins.slice(0, 8).map((pin) => (
                <li key={pin.id}>
                  {pin.bhk}BHK · ₹{pin.rent.toLocaleString("en-IN")} · {pin.furnishing}
                </li>
              ))}
            </ul>
          </div>
        </InfoWindow>
      )}

      <PinDropForm
        open={dropOpen}
        initialLatLng={dropPoint}
        onClose={() => setDropOpen(false)}
        onSubmitted={async () => {
          setDropOpen(false);
          await refreshPins();
        }}
      />

      <StatsPanel
        stats={stats}
        loading={statsLoading}
        filters={activeFilters}
        onClear={clearArea}
        error={statsError}
      />
    </>
  );
}

export default function RentMap(props: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-200">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["drawing"]}>
      <GoogleMapView
        defaultCenter={{ lat: 19.076, lng: 72.8777 }}
        defaultZoom={11}
        mapId="mumbai-rent-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        <MapInner {...props} />
      </GoogleMapView>
    </APIProvider>
  );
}
