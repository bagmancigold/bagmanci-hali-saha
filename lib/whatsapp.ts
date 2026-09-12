/**
 * Meta WhatsApp Cloud API Helper
 */

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v25.0";

export interface SendTemplateOptions {
  to: string; // Telefon numarası (örn: "905324341268")
  templateName?: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
}

export interface SendTextMessageOptions {
  to: string;
  text: string;
}

export type WhatsAppTemplateComponent = {
  type: "body" | "button" | "header";
  sub_type?: string;
  index?: string;
  parameters: { type: "text"; text: string }[];
};

export type BookingConfirmation = {
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  duration_hours?: number;
  total_amount?: number;
  payment_status?: string;
};

const statusLabels: Record<string, string> = {
  paid: "Tamamı ödendi",
  approved: "Onaylandı",
  deposit: "Kapora alındı",
  proof_submitted: "Dekont alındı",
  unpaid: "Maç sonu ödeme",
  pending: "Onay bekliyor",
  rejected: "Reddedildi",
};

function missingConfigResult() {
  return {
    ok: false,
    status: 500,
    data: {
      error: {
        message:
          "WhatsApp ortam değişkenleri eksik: WHATSAPP_PHONE_NUMBER_ID ve WHATSAPP_ACCESS_TOKEN gerekli.",
      },
    },
  };
}

/**
 * WhatsApp Şablon Mesajı Gönder (Örn: Test şablonu veya Rezervasyon Onayı)
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName = "3p_direct_integration_test_template",
  languageCode = "en_US",
  components,
}: SendTemplateOptions) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    return missingConfigResult();
  }

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
        ...(components?.length ? { components } : {}),
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
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    return missingConfigResult();
  }

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

export async function sendBookingConfirmationMessage(booking: BookingConfirmation) {
  const status = statusLabels[booking.payment_status || ""] || booking.payment_status || "Onaylandı";
  const duration = Number(booking.duration_hours || 1);
  const total = Number(booking.total_amount || 0);
  const text =
    `Merhaba ${booking.customer_name},\n\n` +
    `Bagmanci Hali Saha rezervasyonunuz onaylandi.\n` +
    `Tarih: ${booking.booking_date}\n` +
    `Saat: ${booking.booking_time}\n` +
    `Sure: ${duration} saat\n` +
    `Tutar: ${total.toLocaleString("tr-TR")} TL\n` +
    `Durum: ${status}\n\n` +
    `Keyifli maclar dileriz.`;

  const templateName = process.env.WHATSAPP_BOOKING_TEMPLATE_NAME;
  if (!templateName) {
    return sendWhatsAppTextMessage({ to: booking.phone, text });
  }

  return sendWhatsAppTemplateMessage({
    to: booking.phone,
    templateName,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "tr",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: booking.customer_name },
          { type: "text", text: booking.booking_date },
          { type: "text", text: booking.booking_time },
          { type: "text", text: `${duration} saat` },
          { type: "text", text: `${total.toLocaleString("tr-TR")} TL` },
          { type: "text", text: status },
        ],
      },
    ],
  });
}

export async function sendPhoneVerificationCode(to: string, code: string) {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (!templateName) {
    return sendWhatsAppTextMessage({
      to,
      text: `Bagmanci Hali Saha dogrulama kodunuz: ${code}. Kod 10 dakika gecerlidir.`,
    });
  }

  return sendWhatsAppTemplateMessage({
    to,
    templateName,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "tr",
    components: [
      {
        type: "body",
        parameters: [{ type: "text", text: code }],
      },
    ],
  });
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
