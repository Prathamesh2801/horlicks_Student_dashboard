import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Link } from "react-router";
import { MdGroups, MdPhotoLibrary } from "react-icons/md";
import { PIN_COLOR } from "../../../constants/visit";
import { formatDate, formatNumber } from "../../../utils/format";
import { VisitStatusBadge } from "../../visits";

const ODISHA_CENTER = [20.5, 84.6];

// Zooms to show every pin (the default view only covers Odisha).
function FitToPins({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join()).join("|");
  useEffect(() => {
    if (points.length)
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ponytail: plain markers; visits at the same spot overlap. Add leaflet.markercluster when visits reach the thousands.
export default function VisitsMap({ visits }) {
  const pinned = visits.filter((v) => v.lat != null);
  return (
    <MapContainer
      center={ODISHA_CENTER}
      zoom={7}
      className="z-0 size-full min-h-[420px] rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToPins points={pinned.map((v) => [v.lat, v.lng])} />
      {pinned.map((v) => (
        <CircleMarker
          key={v.id}
          center={[v.lat, v.lng]}
          radius={8}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: v.aiFailed ? PIN_COLOR.aiFailed : PIN_COLOR.counted,
            fillOpacity: 1,
          }}
        >
          <Popup>
            <div className="min-w-52 space-y-2 font-sans">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {v.schoolName}
                </p>
                <p className="text-xs text-gray-500">
                  {v.cityName} · {formatDate(v.date)} · {v.staffName}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-gray-800">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <MdGroups className="size-4 text-brand-700" /> AI count{" "}
                  {formatNumber(v.headcount)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MdPhotoLibrary className="size-4 text-gray-500" />{" "}
                  {v.photoCount} photo{v.photoCount === 1 ? "" : "s"}
                </span>
              </div>
              <VisitStatusBadge status={v.status} />
              <Link
                to={`/admin/visits/${v.id}`}
                className="block text-xs font-semibold !text-brand-700"
              >
                Open visit →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
