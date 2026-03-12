export const DRIVE_TIME_MILES_PER_HOUR = 55;

const MILES_PER_DEGREE = 69;
const MIN_COS_LAT = 0.000001;

export type DriveTimeArea = {
  center: {
    lat: number;
    lng: number;
  };
  hours: number;
  radiusMiles: number;
  radiusDegLat: number;
  radiusDegLng: number;
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
};

export function normalizeDriveTimeHours(hours: number, fallback = 2) {
  return Number.isFinite(hours) && hours > 0 ? hours : fallback;
}

export function getDriveTimeArea(lat: number, lng: number, hours: number): DriveTimeArea {
  const normalizedHours = normalizeDriveTimeHours(hours);
  const radiusMiles = normalizedHours * DRIVE_TIME_MILES_PER_HOUR;
  const radiusDegLat = radiusMiles / MILES_PER_DEGREE;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const safeCosLat = Math.abs(cosLat) < MIN_COS_LAT ? MIN_COS_LAT : cosLat;
  const radiusDegLng = radiusMiles / (MILES_PER_DEGREE * safeCosLat);

  return {
    center: { lat, lng },
    hours: normalizedHours,
    radiusMiles,
    radiusDegLat,
    radiusDegLng,
    bbox: {
      minLat: lat - radiusDegLat,
      maxLat: lat + radiusDegLat,
      minLng: lng - radiusDegLng,
      maxLng: lng + radiusDegLng,
    },
  };
}

export function getDriveTimeCircleCoordinates(
  lat: number,
  lng: number,
  hours: number,
  steps = 64,
): [number, number][] {
  const area = getDriveTimeArea(lat, lng, hours);
  const pointCount = Math.max(12, steps);

  return Array.from({ length: pointCount + 1 }, (_, index) => {
    const angle = ((index % pointCount) / pointCount) * Math.PI * 2;
    return [
      lng + area.radiusDegLng * Math.cos(angle),
      lat + area.radiusDegLat * Math.sin(angle),
    ] as [number, number];
  });
}
