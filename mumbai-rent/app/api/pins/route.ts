import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { BHK, Furnishing, Pin, PinType } from "@/lib/types";
import { hashIP } from "@/lib/utils";

const RENT_MIN = 1000;
const RENT_MAX = 500000;
const ALLOWED_BHK: BHK[] = [1, 2, 3, 4];
const ALLOWED_FURNISHING: Furnishing[] = ["unfurnished", "semi", "fully"];
const ALLOWED_PIN_TYPE: PinType[] = ["rent", "seeker", "owner"];

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("pins")
      .select(
        "id, lat, lng, bhk, rent, furnishing, gated, one_liner, pin_type, verified, report_count, created_at, expires_at"
      )
      .lt("report_count", 3)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []) as Pin[]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<{
      lat: number;
      lng: number;
      bhk: BHK;
      rent: number;
      furnishing: Furnishing;
      gated: boolean;
      one_liner: string;
      pin_type: PinType;
      email: string;
    }>;

    const pinType = payload.pin_type ?? "rent";
    if (!ALLOWED_PIN_TYPE.includes(pinType)) {
      return NextResponse.json({ error: "Invalid pin_type" }, { status: 400 });
    }

    if (typeof payload.lat !== "number" || typeof payload.lng !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    if (pinType === "rent") {
      if (!payload.bhk || !ALLOWED_BHK.includes(payload.bhk)) {
        return NextResponse.json({ error: "BHK is required" }, { status: 400 });
      }
      if (
        typeof payload.rent !== "number" ||
        payload.rent < RENT_MIN ||
        payload.rent > RENT_MAX
      ) {
        return NextResponse.json(
          { error: "Rent must be between ₹1,000 and ₹5,00,000." },
          { status: 400 }
        );
      }
      if (!payload.furnishing || !ALLOWED_FURNISHING.includes(payload.furnishing)) {
        return NextResponse.json({ error: "Furnishing is required" }, { status: 400 });
      }
    } else {
      if (!payload.email || !payload.email.trim()) {
        return NextResponse.json(
          { error: "Email is required for seeker/owner pins" },
          { status: 400 }
        );
      }
    }

    if (payload.one_liner && payload.one_liner.length > 120) {
      return NextResponse.json(
        { error: "one_liner must be at most 120 chars" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);
    const ipHash = await hashIP(ip);
    const supabase = getSupabaseAdmin();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("pins")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 3 pins per 24 hours." },
        { status: 429 }
      );
    }

    const { data, error } = await supabase
      .from("pins")
      .insert({
        lat: payload.lat,
        lng: payload.lng,
        bhk: payload.bhk ?? null,
        rent: payload.rent ?? RENT_MIN,
        furnishing: payload.furnishing ?? null,
        gated: payload.gated ?? false,
        one_liner: payload.one_liner ?? null,
        pin_type: pinType,
        ip_hash: ipHash,
      })
      .select(
        "id, lat, lng, bhk, rent, furnishing, gated, one_liner, pin_type, verified, report_count, created_at, expires_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Pin, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
