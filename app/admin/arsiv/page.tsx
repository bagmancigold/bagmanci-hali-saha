"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = { id: string; customer_name: string; phone: string; booking_date: string; booking_time: string; duration_hours: number; package_name: string; total_amount: number; payment_status: string };
const mondayOf = (date: Date) => { const value = new Date(date); value.setHours(12, 0, 0, 0); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return value; };
const iso = (date: Date) => date.toISOString().slice(0, 10);
const formatDate = (date: string) => new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`));

export default function AdminArchivePage() {
  const [authorized, setAuthorized] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const weekStart = useMemo(() => { const value = mondayOf(new Date()); value.setDate(value.getDate() + weekOffset * 7); return value; }, [weekOffset]);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); return iso(date); }), [weekStart]);

  const load = async () => {
    const client = getSupabaseClient();
    const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") { setMessage("Admin girişi ve 2FA gerekli."); return; }
    setAuthorized(true);
    const { data, error } = await client.from("booking_requests").select("id, customer_name, phone, booking_date, booking_time, duration_hours, package_name, total_amount, payment_status").gte("booking_date", dates[0]).lte("booking_date", dates[6]).order("booking_date").order("booking_time");
    if (error) setMessage(error.message); else { setItems(data || []); setMessage(data?.length ? "" : "Bu haftada maç kaydı yok."); }
  };
  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "Arşiv yüklenemedi.")); }, [dates]);
  const remove = async (id: string) => { if (!window.confirm("Bu rezervasyon arşivden silinsin mi?")) return; const { error } = await getSupabaseClient().from("booking_requests").delete().eq("id", id); if (error) setMessage(error.message); else setItems((current) => current.filter((item) => item.id !== id)); };

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-8 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-between"><a href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="flex gap-2"><button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="rounded-full border bg-white p-2" aria-label="Önceki hafta"><ChevronLeft size={18} /></button><button type="button" onClick={() => setWeekOffset((value) => value + 1)} className="rounded-full border bg-white p-2" aria-label="Sonraki hafta"><ChevronRight size={18} /></button></div></div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Haftalık arşiv</p><h1 className="display mt-2 text-4xl font-extrabold">Maç kayıtları</h1><p className="mt-2 text-sm text-[var(--muted)]">{formatDate(dates[0])} - {formatDate(dates[6])}</p>{message && <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold text-[var(--green)]">{message}</p>}<div className="mt-8 grid gap-4 md:grid-cols-2">{dates.map((date) => <section key={date} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 border-b border-[var(--line)] pb-3 text-[var(--green)]"><CalendarDays size={17} /><h2 className="font-extrabold">{formatDate(date)}</h2></div><div className="mt-4 space-y-3">{items.filter((item) => item.booking_date === date).map((item) => <article key={item.id} className="rounded-xl bg-[#f5f7f3] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{item.booking_time} · {item.customer_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.phone} · {item.package_name} · {item.duration_hours || 1} saat</p><p className="mt-2 text-xs font-bold text-[var(--green)]">₺{item.total_amount} · {item.payment_status}</p></div><button type="button" onClick={() => remove(item.id)} className="rounded-full p-2 text-red-600" aria-label="Rezervasyonu sil"><Trash2 size={15} /></button></div></article>)}{!items.some((item) => item.booking_date === date) && <p className="text-sm text-[var(--muted)]">Kayıt yok.</p>}</div></section>)}</div></div></main>;
}
