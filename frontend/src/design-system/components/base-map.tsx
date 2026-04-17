import { MapContainer, TileLayer } from "react-leaflet";
import type { ReactNode } from "react";
import type { LatLngExpression } from "leaflet";
import "@/shared/lib/leaflet.css";

interface BaseMapProps {
  center?: LatLngExpression;
  zoom?: number;
  children?: ReactNode;
  className?: string;
}

const BRAZIL_CENTER: LatLngExpression = [-15.78, -47.93];
const DEFAULT_ZOOM = 5;

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function BaseMap({
  center = BRAZIL_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  className = "h-[400px] w-full",
}: BaseMapProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {children}
      </MapContainer>
    </div>
  );
}
