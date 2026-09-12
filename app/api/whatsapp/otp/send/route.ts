import { randomInt, createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseAdmin";
import { formatPhoneNumber, sendPhoneVerificationCode } from "@/lib/whatsapp";

const OTP_TTL_MINUTES = 10;

function hashCode(phone: string, code: string) {
  const secret =
    process.env.WHATSAPP_OTP_SECRET ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    "local-dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const localPhone = String(phone || "").replace(/\D/g, "");

    if (!/^0\d{10}$/.test(localPhone)) {
      return NextResponse.json(
        { error: "11 haneli telefon numarası gerekli. Örn: 05xxxxxxxxx" },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(localPhone);
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
    const client = getSupabaseServerClient();

    const { error } = await client.from("whatsapp_phone_verifications").insert({
      phone: localPhone,
      formatted_phone: formattedPhone,
      code_hash: hashCode(formattedPhone, code),
      expires_at: expiresAt,
    });

    if (error) throw error;

    const result = await sendPhoneVerificationCode(formattedPhone, code);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.data?.error?.message || "WhatsApp doğrulama kodu gönderilemedi.",
          details: result.data,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({ success: true, expiresAt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kod gönderilemedi." },
      { status: 500 },
    );
  }
}
