"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/cn";

type PropertyMapProps = {
  center: { lng: number; lat: number };
  label: string;
  className?: string;
};

// TODO(launch): swap raw OSM tiles for a managed provider (MapTiler, Protomaps,
// Stadia) before production traffic — OSM's tile policy forbids heavy use.
export function PropertyMap({ center, label, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      map = new maplibregl.Map({
        container: el,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [center.lng, center.lat],
        zoom: 14,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      new maplibregl.Marker({ color: "#C9A254" })
        .setLngLat([center.lng, center.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(label))
        .addTo(map);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [center.lng, center.lat, label]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Map showing ${label}`}
      className={cn("h-[420px] w-full overflow-hidden rounded-sm bg-sand", className)}
    />
  );
}
