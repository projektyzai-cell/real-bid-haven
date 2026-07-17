import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeArea } from "@/lib/nominatim";

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
  "Katowice": [50.2649, 19.0238], "Białystok": [53.1325, 23.1688], "Gdynia": [54.5189, 18.5305],
  "Częstochowa": [50.8118, 19.1203], "Radom": [51.4027, 21.1471], "Sosnowiec": [50.2862, 19.1041],
  "Toruń": [53.0138, 18.5984], "Kielce": [50.8661, 20.6286], "Rzeszów": [50.0413, 21.9990],
  "Gliwice": [50.2945, 18.6714], "Zabrze": [50.3249, 18.7857], "Olsztyn": [53.7784, 20.4801],
  "Bielsko-Biała": [49.8225, 19.0444], "Bytom": [50.3483, 18.9157], "Zielona Góra": [51.9356, 15.5062],
  "Rybnik": [50.0971, 18.5413], "Ruda Śląska": [50.2585, 18.8560], "Opole": [50.6751, 17.9213],
  "Tychy": [50.1357, 18.9985], "Gorzów Wielkopolski": [52.7368, 15.2288], "Dąbrowa Górnicza": [50.3334, 19.2050],
  "Płock": [52.5463, 19.7065], "Elbląg": [54.1522, 19.4088], "Wałbrzych": [50.7714, 16.2845],
  "Włocławek": [52.6483, 19.0677], "Tarnów": [50.0121, 20.9858], "Chorzów": [50.2974, 18.9544],
  "Koszalin": [54.1944, 16.1722], "Kalisz": [51.7619, 18.0910], "Legnica": [51.2070, 16.1551],
  "Grudziądz": [53.4837, 18.7536], "Słupsk": [54.4641, 17.0285], "Jaworzno": [50.2050, 19.2750],
  "Jastrzębie-Zdrój": [49.9501, 18.5949], "Nowy Sącz": [49.6212, 20.6969], "Jelenia Góra": [50.9044, 15.7194],
  "Siedlce": [52.1676, 22.2902], "Mysłowice": [50.2407, 19.1632], "Konin": [52.2233, 18.2511],
  "Piotrków Trybunalski": [51.4053, 19.7030], "Lubin": [51.4017, 16.2017], "Inowrocław": [52.7986, 18.2614],
  "Żyrardów": [52.0489, 20.4458], "Pruszków": [52.1705, 20.8120], "Otwock": [52.1058, 21.2611],
  "Legionowo": [52.4012, 20.9272], "Mińsk Mazowiecki": [52.1801, 21.5723], "Marki": [52.3204, 21.1042],
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
  district?: string;
  value: MapArea | null;
  onChange: (v: MapArea) => void;
}

export function MapAreaPicker({ city, district, value, onChange }: Props) {
  const cityFallback = useMemo<[number, number]>(
    () => CITY_COORDS[city] ?? [52.0693, 19.4803],
    [city],
  );
  const [areaCenter, setAreaCenter] = useState<[number, number]>(cityFallback);
  const [radius, setRadius] = useState(value?.radiusKm ?? 2);

  // When city changes, reset to city centre.
  useEffect(() => { setAreaCenter(cityFallback); }, [cityFallback]);

  // When district provided, geocode it and recentre.
  useEffect(() => {
    if (!city || !district?.trim()) return;
    const ctrl = new AbortController();
    geocodeArea(city, district, ctrl.signal).then((coords) => {
      if (coords) setAreaCenter(coords);
    });
    return () => ctrl.abort();
  }, [city, district]);

  const center: [number, number] = value ? [value.lat, value.lng] : areaCenter;

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
        <Slider
          min={0.5}
          max={20}
          step={0.5}
          value={[radius]}
          onValueChange={([r]) => {
            if (r == null) return;
            setRadius(r);
            if (value) onChange({ ...value, radiusKm: r });
          }}
          className="flex-1"
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
