/**
 * Meta WhatsApp Cloud API Helper
 */

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1313963325139128";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "EAATZCsPNZCIDEBSTL4LH9smQcq6FvaFpsxZA50DAlP6EWY71JPwzt2R8ZAl5yZaTEwTkEIDlSaSyxqIDRYHpIJ4q5hN3FxeE1aPcdcZA3HzTXXHydjeKtn40KVPZAWZBZCZCNajIIZAa1gl11ZAt6xQ0Mwd7aFRlqNeHE5P4PDaggDcet1noot2vOONMzcI4ZCGGEHVj4QZDZD";
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v25.0";

export interface SendTemplateOptions {
  to: string; // Telefon numarası (örn: "905324341268")
  templateName?: string;
  languageCode?: string;
}

export interface SendTextMessageOptions {
  to: string;
  text: string;
}

/**
 * WhatsApp Şablon Mesajı Gönder (Örn: Test şablonu veya Rezervasyon Onayı)
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName = "3p_direct_integration_test_template",
  languageCode = "en_US",
}: SendTemplateOptions) {
  const formattedPhone = formatPhoneNumber(to);
  const url = `https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

/**
 * WhatsApp Serbest Metin Mesajı Gönder (Müşteri son 24 saatte mesaj yazdıysa geçerlidir)
 */
export async function sendWhatsAppTextMessage({ to, text }: SendTextMessageOptions) {
  const formattedPhone = formatPhoneNumber(to);
  const url = `https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

/**
 * Telefon numarasını uluslararası formata dönüştürür (905XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("0")) {
    cleaned = "9" + cleaned;
  } else if (!cleaned.startsWith("90")) {
    cleaned = "90" + cleaned;
  }
  return cleaned;
}
