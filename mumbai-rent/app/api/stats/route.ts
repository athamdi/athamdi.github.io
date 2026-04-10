import { NextResponse } from "next/server";
import type { BHK, Furnishing } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase";

interface StatsRequestBody {
  polygon: {
    type: "Polygon";
    coordinates: number[][][];
  };
  filters?: {
    bhk?: BHK | null;
    furnishing?: Furnishing | null;
    gated?: boolean | null;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StatsRequestBody;

    if (!body.polygon || body.polygon.type !== "Polygon") {
      return NextResponse.json(
        { error: "A valid GeoJSON polygon is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("get_polygon_stats", {
      polygon_geojson: JSON.stringify(body.polygon),
      filter_bhk: body.filters?.bhk ?? null,
      filter_furnishing: body.filters?.furnishing ?? null,
      filter_gated: body.filters?.gated ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
