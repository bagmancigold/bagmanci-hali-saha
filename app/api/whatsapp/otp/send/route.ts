import { randomInt, createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseAdmin";
import { formatPhoneNumber, sendPhoneVerificationCode } from "@/lib/whatsapp";

const OTP_TTL_MINUTES = 10;

function normalizeLocalPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (/^5\d{9}$/.test(digits)) return `0${digits}`;
  if (/^0\d{10}$/.test(digits)) return digits;
  if (/^90(5\d{9})$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
}

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
    const localPhone = normalizeLocalPhone(String(phone || ""));

    if (!/^0\d{10}$/.test(localPhone)) {
      return NextResponse.json(
        { error: "Telefon numarası gerekli. Örn: 543xxxxxxx veya 0543xxxxxxx" },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(localPhone);
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

    if (!process.env.WHATSAPP_OTP_TEMPLATE_NAME) {
      return NextResponse.json(
        {
          error:
            "WHATSAPP_OTP_TEMPLATE_NAME eksik. WhatsApp doğrulama kodu için Meta'da onaylı OTP template'i gerekir.",
        },
        { status: 500 },
      );
    }

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
