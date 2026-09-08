"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, CreditCard, Upload } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

type Booking = { id: string; customer_name: string; phone: string; booking_date: string; booking_time: string; package_name: string; total_amount: number; deposit_amount: number; payment_choice: "deposit" | "full"; };

export default function PaymentPage() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [choice, setChoice] = useState<"deposit" | "full">("deposit");
  const [iban, setIban] = useState({ bank: "", number: "", holder: "" });
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState("Ödeme bilgileri hazırlanıyor...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const id = new URLSearchParams(window.location.search).get("booking");
      if (!id) { setMessage("Ödeme talebi bulunamadı."); return; }
      try {
        const client = getSupabaseClient();
        const [{ data, error }, { data: settings }] = await Promise.all([
          client.from("booking_requests").select("id, customer_name, phone, booking_date, booking_time, package_name, total_amount, deposit_amount, payment_choice").eq("id", id).maybeSingle(),
          client.from("site_settings").select("bank_name, iban, iban_holder").eq("id", "main").maybeSingle()
        ]);
        if (error) throw error;
        if (!data) throw new Error("Ödeme talebi bulunamadı.");
        setBooking(data); setChoice(data.payment_choice); setIban({ bank: settings?.bank_name || "", number: settings?.iban || "", holder: settings?.iban_holder || "" }); setMessage("");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Ödeme bilgileri yüklenemedi."); }
    };
    load();
  }, []);

  const submitPayment = async () => {
    if (!booking) return;
    setSaving(true); setMessage("");
    try {
      const client = getSupabaseClient();
      let proofPath = "";
      if (proof) {
        const path = `payment-proofs/${booking.id}-${Date.now()}.${proof.name.split(".").pop() || "jpg"}`;
        const { error } = await client.storage.from("site-assets").upload(path, proof, { contentType: proof.type, upsert: false });
        if (error) throw error;
        proofPath = path;
      }
      const { error } = await client.from("booking_requests").update({ payment_choice: choice, payment_status: proofPath ? "proof_submitted" : "pending", notes: proofPath ? `Dekont: ${proofPath}` : "Ödeme bildirimi bekleniyor." }).eq("id", booking.id);
      if (error) throw error;
      setMessage("Ödeme bildirimin alındı. Admin onayından sonra rezervasyonun kesinleşecek.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ödeme bildirimi gönderilemedi."); }
    finally { setSaving(false); }
  };

  const amount = booking ? choice === "full" ? booking.total_amount : booking.deposit_amount : 0;
  return <main className="payment-page min-h-screen px-5 py-10"><div className="mx-auto max-w-4xl"><a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[28px] bg-white p-7 shadow-xl sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Ödeme ve rezervasyon</p><h1 className="display mt-3 text-4xl font-extrabold">Maçını kesinleştir.</h1>{booking && <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{booking.booking_date} · {booking.booking_time} · {booking.package_name}<br />{booking.customer_name} adına ödeme bildirimi.</p>}<div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setChoice("deposit")} className={`payment-choice ${choice === "deposit" ? "payment-choice-active" : ""}`}><span>Kapora</span><strong>₺600</strong><small>Rezervasyonu ayır</small></button><button type="button" onClick={() => setChoice("full")} className={`payment-choice ${choice === "full" ? "payment-choice-active" : ""}`}><span>Ücretin tamamı</span><strong>₺{booking?.total_amount || 0}</strong><small>Ödemeyi tek seferde bitir</small></button></div><label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-[var(--green)] px-4 py-4 text-sm font-bold text-[var(--green)]"><Upload size={17} /> Dekont yükle<input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden" onChange={(event) => setProof(event.target.files?.[0] || null)} /></label>{proof && <p className="mt-3 text-sm text-[var(--muted)]">Seçilen dekont: {proof.name}</p>}<button type="button" disabled={!booking || saving} onClick={submitPayment} className="payment-submit mt-6"><CreditCard size={17} /> {saving ? "Gönderiliyor..." : `₺${amount} ödeme bildirimini gönder`}</button>{message && <p className="mt-5 rounded-2xl bg-[#f3f6f0] p-4 text-sm font-semibold leading-6 text-[var(--green)]">{message}</p>}</section><aside className="payment-bank rounded-[28px] p-7 text-white sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><CreditCard size={23} /></div><h2 className="display mt-8 text-3xl font-extrabold">IBAN ile güvenli ödeme</h2><p className="mt-3 text-sm leading-6 text-white/70">Tutarı gönderdikten sonra dekontunu ekle. Admin onayı olmadan rezervasyon kesinleşmez.</p><div className="mt-8 space-y-4 rounded-2xl bg-white/10 p-5"><div><p className="text-xs text-white/55">Banka</p><p className="mt-1 font-bold">{iban.bank || "Admin tarafından eklenecek"}</p></div><div><p className="text-xs text-white/55">Hesap sahibi</p><p className="mt-1 font-bold">{iban.holder || "Admin tarafından eklenecek"}</p></div><div><p className="text-xs text-white/55">IBAN</p><div className="mt-1 flex items-start justify-between gap-2"><p className="break-all font-bold tracking-wide">{iban.number || "Admin ayarlarından IBAN eklenmeli"}</p>{iban.number && <button type="button" aria-label="IBAN kopyala" onClick={() => navigator.clipboard.writeText(iban.number)}><Copy size={17} /></button>}</div></div></div><p className="mt-6 flex items-start gap-2 text-xs leading-5 text-white/60"><Check size={15} className="mt-0.5 shrink-0 text-[var(--lime)]" /> Kart bilgilerin bu sitede tutulmaz. Ödeme bildirimi ve dekont yalnızca rezervasyon onayı için işlenir.</p></aside></div></div></main>;
}
