import { useEffect, useState } from "react";
import { Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import { BaseMap } from "@/design-system/components/base-map";
import { Loader2, Navigation, MapPin } from "lucide-react";
import { formatNumber } from "@/shared/lib/formatters";

interface RouteMapProps {
  originLat: number | null;
  originLng: number | null;
  originLabel?: string;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationLabel?: string;
  className?: string;
}

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

interface RouteData {
  coordinates: LatLngTuple[];
  distanceKm: number;
  durationHours: number;
}

function createIcon(color: string, size = 14): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const originIcon = createIcon("#EA580C", 16);
const destIcon = createIcon("#059669", 16);

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    } else if (points.length === 1) {
      map.setView(points[0]!, 12);
    }
  }, [map, points]);
  return null;
}

async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<RouteData | null> {
  try {
    const url = `${OSRM_URL}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const coords: LatLngTuple[] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as LatLngTuple,
    );

    return {
      coordinates: coords,
      distanceKm: Math.round(route.distance / 1000),
      durationHours: Math.round((route.duration / 3600) * 10) / 10,
    };
  } catch {
    return null;
  }
}

export function RouteMap({
  originLat,
  originLng,
  originLabel = "Origem",
  destinationLat,
  destinationLng,
  destinationLabel = "Destino",
  className = "h-[400px] w-full",
}: RouteMapProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);

  const hasOrigin = originLat !== null && originLng !== null;
  const hasDest = destinationLat !== null && destinationLng !== null;
  const hasBoth = hasOrigin && hasDest;

  useEffect(() => {
    if (!hasBoth) {
      setRouteData(null);
      return;
    }
    setLoading(true);
    fetchRoute(originLat!, originLng!, destinationLat!, destinationLng!)
      .then((data) => setRouteData(data))
      .finally(() => setLoading(false));
  }, [originLat, originLng, destinationLat, destinationLng, hasBoth]);

  if (!hasOrigin && !hasDest) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-border-default bg-surface-secondary ${className}`}>
        <div className="flex flex-col items-center gap-2 text-content-tertiary">
          <MapPin className="h-6 w-6" />
          <p className="text-sm">Informe coordenadas de origem e destino para ver o mapa</p>
        </div>
      </div>
    );
  }

  const center: LatLngExpression = hasOrigin
    ? [originLat!, originLng!]
    : [destinationLat!, destinationLng!];

  const fitPoints: LatLngExpression[] = [];
  if (hasOrigin) fitPoints.push([originLat!, originLng!]);
  if (hasDest) fitPoints.push([destinationLat!, destinationLng!]);

  return (
    <div className="space-y-3">
      <BaseMap center={center} zoom={hasBoth ? 6 : 12} className={className}>
        <FitBounds points={fitPoints} />

        {hasOrigin && (
          <Marker position={[originLat!, originLng!]} icon={originIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-orange-600">{originLabel}</p>
                <p className="text-xs text-gray-500">
                  {originLat!.toFixed(6)}, {originLng!.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {hasDest && (
          <Marker position={[destinationLat!, destinationLng!]} icon={destIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-emerald-600">{destinationLabel}</p>
                <p className="text-xs text-gray-500">
                  {destinationLat!.toFixed(6)}, {destinationLng!.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {routeData && (
          <Polyline
            positions={routeData.coordinates}
            pathOptions={{
              color: "#EA580C",
              weight: 4,
              opacity: 0.8,
              dashArray: undefined,
            }}
          />
        )}
      </BaseMap>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-content-tertiary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Calculando rota...
        </div>
      )}

      {routeData && !loading && (
        <div className="flex items-center gap-6 rounded-lg bg-brand-accent-soft px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-brand-accent" />
            <div>
              <p className="text-xs font-medium text-brand-accent">Distância pela rota</p>
              <p className="text-sm font-bold text-content-primary">{formatNumber(routeData.distanceKm)} km</p>
            </div>
          </div>
          <div className="h-8 w-px bg-brand-accent/20" />
          <div>
            <p className="text-xs font-medium text-brand-accent">Tempo estimado</p>
            <p className="text-sm font-bold text-content-primary">{routeData.durationHours}h</p>
          </div>
        </div>
      )}
    </div>
  );
}
