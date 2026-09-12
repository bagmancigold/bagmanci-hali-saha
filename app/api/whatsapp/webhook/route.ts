import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseAdmin";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

type ReadyReply = {
  keyword: string;
  response_text: string;
  active: boolean;
};

const defaultReplies: ReadyReply[] = [
  {
    keyword: "fiyat",
    response_text:
      "Gunduz tarifesi 1200 TL, gece tarifesi 1800 TL. Rezervasyon icin web sitemizden gun ve saat secebilirsiniz.",
    active: true,
  },
  {
    keyword: "rezervasyon",
    response_text:
      "Rezervasyon icin web sitesindeki takvimden musait gun ve saati secmeniz yeterli. Odeme/dekont sonrasi kaydiniz kesinlesir.",
    active: true,
  },
  {
    keyword: "adres",
    response_text:
      "Bagmanci Hali Saha Sanliurfa. Konum icin web sitemizdeki iletisim bolumunu acabilirsiniz.",
    active: true,
  },
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "bagmanci_halisaha_secret_verify_123";

  if (mode === "subscribe" && token && token === verifyToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json({ error: "Webhook doğrulanamadı." }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const messages =
      payload?.entry?.flatMap((entry: any) =>
        entry?.changes?.flatMap((change: any) => change?.value?.messages || []) || [],
      ) || [];

    if (!messages.length) {
      return NextResponse.json({ success: true });
    }

    const client = getSupabaseServerClient();
    const { data } = await client
      .from("whatsapp_ready_replies")
      .select("keyword, response_text, active")
      .eq("active", true)
      .order("priority", { ascending: true });
    const replies = data?.length ? data : defaultReplies;

    await Promise.all(
      messages.map(async (message: any) => {
        const from = message.from;
        const incomingText = String(message.text?.body || "").toLocaleLowerCase("tr-TR");
        if (!from || !incomingText) return;

        const matched = replies.find((reply) =>
          incomingText.includes(reply.keyword.toLocaleLowerCase("tr-TR")),
        );

        if (matched) {
          await sendWhatsAppTextMessage({ to: from, text: matched.response_text });
        }
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook işlenemedi." },
      { status: 500 },
    );
  }
}
