import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseAdmin";
import { formatPhoneNumber } from "@/lib/whatsapp";

function hashCode(phone: string, code: string) {
  const secret =
    process.env.WHATSAPP_OTP_SECRET ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    "local-dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeLocalPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (/^5\d{9}$/.test(digits)) return `0${digits}`;
  if (/^0\d{10}$/.test(digits)) return digits;
  if (/^90(5\d{9})$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    const localPhone = normalizeLocalPhone(String(phone || ""));
    const token = String(code || "").replace(/\D/g, "");

    if (!/^0\d{10}$/.test(localPhone) || !/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: "Telefon ve 6 haneli kod gerekli." }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(localPhone);
    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from("whatsapp_phone_verifications")
      .select("id, code_hash, expires_at, attempts, used_at")
      .eq("formatted_phone", formattedPhone)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Aktif doğrulama kodu bulunamadı." }, { status: 404 });
    }
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Kodun süresi doldu. Yeni kod iste." }, { status: 400 });
    }
    if (Number(data.attempts || 0) >= 5) {
      return NextResponse.json({ error: "Çok fazla deneme yapıldı. Yeni kod iste." }, { status: 429 });
    }

    const isValid = safeCompare(data.code_hash, hashCode(formattedPhone, token));
    if (!isValid) {
      await client
        .from("whatsapp_phone_verifications")
        .update({ attempts: Number(data.attempts || 0) + 1 })
        .eq("id", data.id);
      return NextResponse.json({ error: "Kod hatalı." }, { status: 400 });
    }

    await client
      .from("whatsapp_phone_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);

    return NextResponse.json({ success: true, phone: localPhone });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kod doğrulanamadı." },
      { status: 500 },
    );
  }
}
