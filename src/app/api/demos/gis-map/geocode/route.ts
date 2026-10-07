import { NextRequest, NextResponse } from "next/server";

export type GeocodeResult = {
  id: string;
  title: string;
  label: string;
  lat: number;
  lng: number;
  source: "photon" | "nominatim" | "layer";
};

function formatPhotonTitle(props: Record<string, string | undefined>) {
  return props.name ?? props.street ?? props.city ?? "Place";
}

function formatPhotonLabel(props: Record<string, string | undefined>) {
  const parts = [
    props.name,
    props.housenumber && props.street ? `${props.housenumber} ${props.street}` : props.street,
    props.district,
    props.city,
    props.state,
    props.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function pushResult(
  results: GeocodeResult[],
  seen: Set<string>,
  item: Omit<GeocodeResult, "id">,
) {
  const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)},${item.title.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  results.push({ ...item, id: `${item.source}-${results.length}` });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([] satisfies GeocodeResult[]);
  }

  const results: GeocodeResult[] = [];
  const seen = new Set<string>();

  try {
    const photonUrl = new URL("https://photon.komoot.io/api/");
    photonUrl.searchParams.set("q", q);
    photonUrl.searchParams.set("lat", "3.07255");
    photonUrl.searchParams.set("lon", "101.84555");
    photonUrl.searchParams.set("limit", "12");
    photonUrl.searchParams.set("lang", "en");

    const photonRes = await fetch(photonUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (photonRes.ok) {
      const photonData = (await photonRes.json()) as {
        features?: {
          geometry: { coordinates: [number, number] };
          properties: Record<string, string | undefined>;
        }[];
      };

      for (const feature of photonData.features ?? []) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const country = props.country?.toLowerCase() ?? "";
        if (country && country !== "malaysia") continue;
        if (!country && (lat < 0.8 || lat > 7.8 || lng < 99 || lng > 119.8)) continue;
        const title = formatPhotonTitle(props);
        const label = formatPhotonLabel(props);
        if (!label) continue;
        pushResult(results, seen, { title, label, lat, lng, source: "photon" });
        if (results.length >= 12) break;
      }
    }
  } catch {
    // continue
  }

  try {
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
    const nomQuery = /\bmalaysia\b/i.test(q) ? q : `${q}, Malaysia`;
    nominatimUrl.searchParams.set("q", nomQuery);
    nominatimUrl.searchParams.set("format", "json");
    nominatimUrl.searchParams.set("limit", "10");
    nominatimUrl.searchParams.set("countrycodes", "my");
    nominatimUrl.searchParams.set("dedupe", "0");

    const nomRes = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "AfiqAiditPortfolioGISDemo/1.0 (contact: afiqariff9314@gmail.com)",
      },
      next: { revalidate: 300 },
    });

    if (nomRes.ok) {
      const nomData = (await nomRes.json()) as {
        lat: string;
        lon: string;
        display_name: string;
        name?: string;
      }[];

      for (const item of nomData) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const title = item.name ?? item.display_name.split(",")[0] ?? item.display_name;
        pushResult(results, seen, {
          title,
          label: item.display_name,
          lat,
          lng,
          source: "nominatim",
        });
        if (results.length >= 15) break;
      }
    }
  } catch {
    // return partial
  }

  return NextResponse.json(results.slice(0, 15));
}
