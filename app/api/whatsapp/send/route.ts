import { NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, type, text, templateName, languageCode } = body;

    if (!to) {
      return NextResponse.json({ error: "Telefon numarası (to) gerekli" }, { status: 400 });
    }

    if (type === "text") {
      if (!text) {
        return NextResponse.json({ error: "Mesaj metni (text) gerekli" }, { status: 400 });
      }
      const result = await sendWhatsAppTextMessage({ to, text });
      if (!result.ok) {
        return NextResponse.json({ error: result.data?.error?.message || "WhatsApp gönderim hatası", details: result.data }, { status: result.status });
      }
      return NextResponse.json({ success: true, data: result.data });
    } else {
      // Şablon mesajı (Default)
      const result = await sendWhatsAppTemplateMessage({
        to,
        templateName: templateName || "3p_direct_integration_test_template",
        languageCode: languageCode || "en_US",
      });

      if (!result.ok) {
        // Yedek şablon dene (hello_world)
        const fallbackResult = await sendWhatsAppTemplateMessage({
          to,
          templateName: "hello_world",
          languageCode: "en_US",
        });

        if (!fallbackResult.ok) {
          return NextResponse.json({ error: fallbackResult.data?.error?.message || result.data?.error?.message || "WhatsApp gönderim hatası", details: fallbackResult.data || result.data }, { status: fallbackResult.status });
        }
        return NextResponse.json({ success: true, data: fallbackResult.data });
      }

      return NextResponse.json({ success: true, data: result.data });
    }
  } catch (error: any) {
    console.error("WhatsApp API Route Hatası:", error);
    return NextResponse.json({ error: error.message || "Sunucu hatası" }, { status: 500 });
  }
}
