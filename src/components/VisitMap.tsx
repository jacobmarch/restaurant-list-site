"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatVisitDate } from "@/lib/format";
import { formatStarGlyphs } from "@/lib/rating";
import { getVisitImageUrl } from "@/lib/storage";
import type { TimelineVisit } from "@/lib/types";

type VisitMapProps = {
  visits: TimelineVisit[];
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function VisitMap({ visits }: VisitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const mappedVisits = visits.filter(
    (visit) => visit.lat != null && visit.lng != null,
  );

  useEffect(() => {
    if (!containerRef.current || mappedVisits.length === 0) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    for (const visit of mappedVisits) {
      const lat = visit.lat!;
      const lng = visit.lng!;

      const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);

      marker.bindPopup(buildVisitPopupHtml(visit), {
        maxWidth: 220,
        minWidth: 180,
        className: "visit-map-popup",
      });
      bounds.extend([lat, lng]);
    }

    if (mappedVisits.length === 1) {
      map.setView([mappedVisits[0].lat!, mappedVisits[0].lng!], 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Rebuild markers when visit locations change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mappedVisits derived from visits
  }, [visits]);

  if (mappedVisits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-display text-lg text-stone-700">No locations yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Add an address to a visit and it will show up here.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[min(70vh,520px)] w-full rounded-2xl shadow-sm ring-1 ring-rose-100/60 [&_.visit-map-popup_.leaflet-popup-content]:m-2.5 [&_.visit-map-popup_.leaflet-popup-content-wrapper]:rounded-xl [&_.visit-map-popup_.leaflet-popup-content-wrapper]:p-0 [&_.visit-map-popup_.leaflet-popup-content-wrapper]:shadow-md"
      aria-label="Map of restaurant visits"
    />
  );
}

function buildVisitPopupHtml(visit: TimelineVisit): string {
  const parts = [
    `<div style="max-width:200px;font-family:inherit;color:#44403c;">`,
    `<p style="margin:0;font-size:0.95rem;font-weight:600;line-height:1.3;">${escapeHtml(visit.restaurantName)}</p>`,
    `<p style="margin:0.25rem 0 0;font-size:0.7rem;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:#fb7185;">${escapeHtml(formatVisitDate(visit.visited_at))}</p>`,
    `<p style="margin:0.35rem 0 0;font-size:0.85rem;letter-spacing:0.06em;color:#f43f5e;" aria-label="${visit.rating} out of 5 stars">${escapeHtml(formatStarGlyphs(visit.rating))}</p>`,
  ];

  if (visit.image_path) {
    const imageUrl = escapeHtml(getVisitImageUrl(visit.image_path));
    const alt = escapeHtml(`Photo from visit to ${visit.restaurantName}`);
    parts.push(
      `<img src="${imageUrl}" alt="${alt}" style="display:block;width:100%;max-height:110px;margin-top:0.5rem;border-radius:0.5rem;object-fit:cover;" />`,
    );
  }

  if (visit.notes) {
    parts.push(
      `<p style="margin:0.5rem 0 0;font-size:0.8rem;font-style:italic;line-height:1.35;color:#78716c;">&ldquo;${escapeHtml(visit.notes)}&rdquo;</p>`,
    );
  }

  parts.push(`</div>`);
  return parts.join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
