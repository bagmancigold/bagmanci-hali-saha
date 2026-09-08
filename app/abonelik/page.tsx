"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3 } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const times = ["09:00", "10:00", "11:00", "12:00", "18:00", "19:00", "20:00", "21:00"];

export default function SubscriptionPage() {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [day, setDay] = useState(days[0]); const [time, setTime] = useState(times[0]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!name.trim() || !phone.trim()) { setMessage("Ad soyad ve telefon zorunlu."); return; }
    setLoading(true); setMessage("");
    try { const { data, error } = await getSupabaseClient().from("subscription_requests").insert({ customer_name: name.trim(), phone: phone.trim(), subscription_day: day, subscription_time: time, amount: 0 }).select("id").single(); if (error) throw error; setMessage(`Abonelik talebin alındı. Talep no: ${data.id.slice(0, 8)}. Ücretin tamamı, admin onayından sonra ödeme adımında istenecek.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Abonelik talebi oluşturulamadı."); }
    finally { setLoading(false); }
  };
  return <main className="customer-page min-h-screen px-5 py-10"><div className="mx-auto max-w-3xl"><a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><section className="rounded-[28px] bg-white p-7 shadow-xl sm:p-12"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Takım aboneliği</p><h1 className="display mt-3 text-5xl font-extrabold">Her hafta aynı gün, aynı saha.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">Günü ve saati seç. Abonelikte ücretin tamamını önceden ödeyerek saatinizi sabitleyin; admin onayı sonrası ödeme bilgileri paylaşılır.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Ad soyad<input value={name} onChange={(event) => setName(event.target.value)} className="customer-input" placeholder="Takım kaptanı" /></label><label className="text-sm font-bold">Telefon<input value={phone} onChange={(event) => setPhone(event.target.value)} className="customer-input" placeholder="05xx xxx xx xx" /></label></div><div className="mt-8 grid gap-5 sm:grid-cols-2"><div><p className="mb-3 flex items-center gap-2 text-sm font-bold"><CalendarDays size={17} /> Abonelik günü</p><div className="grid grid-cols-2 gap-2">{days.map((item) => <button type="button" key={item} onClick={() => setDay(item)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${day === item ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)]"}`}>{item}</button>)}</div></div><div><p className="mb-3 flex items-center gap-2 text-sm font-bold"><Clock3 size={17} /> Abonelik saati</p><div className="grid grid-cols-2 gap-2">{times.map((item) => <button type="button" key={item} onClick={() => setTime(item)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${time === item ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)]"}`}>{item}</button>)}</div></div></div><button type="button" disabled={loading} onClick={submit} className="customer-primary-button mt-8">{loading ? "Gönderiliyor..." : "Abonelik talebi oluştur"}<ArrowRight size={17} /></button>{message && <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f3f6f0] p-4 text-sm font-semibold leading-6 text-[var(--green)]"><Check size={17} /> {message}</p>}</section></div></main>;
}