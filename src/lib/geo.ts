/**
 * Geospatial utilities for Hobio Map Discovery.
 * - Haversine distance calculation
 * - Geocoding via Google Geocoding API
 * - Region helpers
 */

const GOOGLE_GEOCODING_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Earth's radius in kilometers */
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the Haversine distance between two lat/lng points.
 * @returns Distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Format distance for display.
 * Shows km if >= 1, otherwise meters.
 */
export function formatDistance(km: number): string {
  if (km < 0.1) return `${Math.round(km * 1000)}m`;
  if (km < 1) return `${(km * 1000).toFixed(0)}m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Uses Google Geocoding API.
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!GOOGLE_GEOCODING_API_KEY) {
    console.warn("Google Maps API key not set. Skipping geocoding.");
    return null;
  }

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_GEOCODING_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }

    console.warn("Geocoding returned no results for:", address);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Check if a point is within the given map region (bounds).
 */
export function isPointInRegion(
  lat: number,
  lng: number,
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
): boolean {
  const latMin = region.latitude - region.latitudeDelta / 2;
  const latMax = region.latitude + region.latitudeDelta / 2;
  const lngMin = region.longitude - region.longitudeDelta / 2;
  const lngMax = region.longitude + region.longitudeDelta / 2;
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
}

/** Default region: city center fallback (Vilnius, Lithuania) */
export const DEFAULT_REGION = {
  latitude: 54.6872,
  longitude: 25.2797,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
