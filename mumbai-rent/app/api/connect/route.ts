import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashIP } from "@/lib/utils";

interface ConnectPayload {
  seeker_email: string;
  owner_pin_id: string;
  message: string;
}

interface OwnerContactRow {
  pin_id: string;
  email: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<ConnectPayload>;
    const seekerEmail = body.seeker_email?.trim() ?? "";
    const ownerPinId = body.owner_pin_id?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!seekerEmail || !ownerPinId || !message) {
      return NextResponse.json(
        { error: "seeker_email, owner_pin_id and message are required." },
        { status: 400 }
      );
    }
    if (!isEmail(seekerEmail)) {
      return NextResponse.json({ error: "Invalid seeker_email." }, { status: 400 });
    }
    if (message.length > 1500) {
      return NextResponse.json(
        { error: "Message is too long (max 1500 chars)." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: ownerRow, error: ownerError } = await supabase
      .from("pin_private_contacts")
      .select("pin_id,email")
      .eq("pin_id", ownerPinId)
      .single<OwnerContactRow>();

    if (ownerError || !ownerRow) {
      return NextResponse.json(
        { error: "Owner contact not found for this pin." },
        { status: 404 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const fromAddress = "mumbai.rent <connect@mumbai.rent>";

    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: ownerRow.email,
      subject: "New flatmate connection request on mumbai.rent",
      text: [
        "You have a new connection request.",
        "",
        `Pin ID: ${ownerPinId}`,
        `Seeker email: ${seekerEmail}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    if (emailResult.error) {
      return NextResponse.json(
        { error: "Failed to relay email via Resend." },
        { status: 502 }
      );
    }

    const seekerEmailHash = await hashIP(seekerEmail.toLowerCase());
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip")?.trim() ??
      "unknown";
    const ipHash = await hashIP(ip);

    const logPayload = {
      owner_pin_id: ownerPinId,
      seeker_email_hash: seekerEmailHash,
      message_preview: message.slice(0, 120),
      ip_hash: ipHash,
      created_at: new Date().toISOString(),
    };

    const { error: logError } = await supabase
      .from("connect_attempts")
      .insert(logPayload);

    if (logError) {
      return NextResponse.json(
        { error: "Email sent, but failed to log connection attempt." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      { status: 400 }
    );
  }
}
