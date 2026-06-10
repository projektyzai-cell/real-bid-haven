import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Vite asset-resolution quirk)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export interface MapArea { lat: number; lng: number; radiusKm: number }

const CITY_COORDS: Record<string, [number, number]> = {
  "Warszawa": [52.2297, 21.0122], "Kraków": [50.0647, 19.945], "Łódź": [51.7592, 19.4560],
  "Wrocław": [51.1079, 17.0385], "Poznań": [52.4064, 16.9252], "Gdańsk": [54.352, 18.6466],
  "Szczecin": [53.4285, 14.5528], "Bydgoszcz": [53.1235, 18.0084], "Lublin": [51.2465, 22.5684],
  "Katowice": [50.2649, 19.0238],
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  city: string;
  value: MapArea | null;
  onChange: (v: MapArea) => void;
}

export function MapAreaPicker({ city, value, onChange }: Props) {
  const fallback = useMemo<[number, number]>(
    () => CITY_COORDS[city] ?? [52.0693, 19.4803],
    [city],
  );
  const [radius, setRadius] = useState(value?.radiusKm ?? 2);
  const center: [number, number] = value ? [value.lat, value.lng] : fallback;

  useEffect(() => {
    if (value) setRadius(value.radiusKm);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border" style={{ height: 320 }}>
        <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          <ClickHandler onPick={(lat, lng) => onChange({ lat, lng, radiusKm: radius })} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={icon} />
              <Circle center={[value.lat, value.lng]} radius={value.radiusKm * 1000} pathOptions={{ color: "#d4af37", fillOpacity: 0.12 }} />
            </>
          )}
        </MapContainer>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">Promień: <strong className="text-foreground">{radius.toFixed(1)} km</strong></label>
        <input
          type="range" min={0.5} max={20} step={0.5} value={radius}
          onChange={(e) => {
            const r = Number(e.target.value);
            setRadius(r);
            if (value) onChange({ ...value, radiusKm: r });
          }}
          className="flex-1 accent-[var(--gold)]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {value
          ? `Wybrany punkt: ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
          : "Kliknij na mapie, aby zaznaczyć centrum obszaru poszukiwań."}
      </p>
    </div>
  );
}
