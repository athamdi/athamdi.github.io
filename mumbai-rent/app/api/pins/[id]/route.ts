import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "report") {
      return NextResponse.json(
        { error: "Unsupported action. Use action=report." },
        { status: 400 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing pin id." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: row, error: fetchError } = await supabaseAdmin
      .from("pins")
      .select("id, report_count")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Pin not found." }, { status: 404 });
    }

    const nextReportCount = (row.report_count ?? 0) + 1;
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("pins")
      .update({ report_count: nextReportCount })
      .eq("id", id)
      .select(
        "id, lat, lng, bhk, rent, furnishing, gated, one_liner, pin_type, verified, report_count, created_at, expires_at"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to report pin." },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
