export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export type GeocodeError = {
  error: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | GeocodeError> {
  const trimmed = address.trim();

  if (!trimmed) {
    return { error: "Please enter an address." };
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "1",
  });

  let response: Response;

  try {
    response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": "RestaurantVisitsApp/1.0 (private couple visit tracker)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
  } catch {
    return { error: "Could not reach the geocoding service. Try again later." };
  }

  if (!response.ok) {
    return { error: "Geocoding failed. Please try again." };
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  if (!results.length) {
    return {
      error: "Could not find that address. Try a more specific search.",
    };
  }

  const [first] = results;
  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "Geocoding returned invalid coordinates." };
  }

  return {
    lat,
    lng,
    displayName: first.display_name,
  };
}
