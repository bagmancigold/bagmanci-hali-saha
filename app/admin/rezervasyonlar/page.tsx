"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = { id: string; customer_name: string; phone: string; booking_date: string; booking_time: string; duration_hours: number; package_name: string; total_amount: number; paid_amount?: number; payment_status: string };
const statusLabels: Record<string, string> = { paid: "Tamamı ödendi", approved: "Tamamı ödendi", deposit: "Kapora", proof_submitted: "Kapora", unpaid: "Ödenmedi", pending: "Ödenmedi", rejected: "Reddedildi" };
const mondayOf = (date: Date) => { const value = new Date(date); value.setHours(12, 0, 0, 0); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return value; };
const iso = (date: Date) => date.toISOString().slice(0, 10);
const dateLabel = (value: string) => new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));

export default function AdminBookingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const weekStart = useMemo(() => { const value = mondayOf(new Date()); value.setDate(value.getDate() + weekOffset * 7); return value; }, [weekOffset]);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const value = new Date(weekStart); value.setDate(value.getDate() + index); return iso(value); }), [weekStart]);

  const load = async () => {
    const client = getSupabaseClient();
    const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") { setMessage("Admin girişi ve 2FA gerekli."); return; }
    setAuthorized(true);
    const { data, error } = await client.from("booking_requests").select("id, customer_name, phone, booking_date, booking_time, duration_hours, package_name, total_amount, paid_amount, payment_status").gte("booking_date", dates[0]).lte("booking_date", dates[6]).order("booking_date").order("booking_time");
    if (error) setMessage(error.message); else { setBookings(data || []); setMessage(data?.length ? "" : "Bu hafta rezervasyon yok."); }
  };
  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "Rezervasyonlar yüklenemedi.")); }, [dates]);

  const updateStatus = async (id: string, payment_status: string) => { const { error } = await getSupabaseClient().from("booking_requests").update({ payment_status }).eq("id", id); if (error) setMessage(error.message); else setBookings((current) => current.map((item) => item.id === id ? { ...item, payment_status } : item)); };

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-8 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-between"><a href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="flex gap-2"><button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="rounded-full border bg-white p-2" aria-label="Önceki hafta"><ChevronLeft size={18} /></button><button type="button" onClick={() => setWeekOffset((value) => value + 1)} className="rounded-full border bg-white p-2" aria-label="Sonraki hafta"><ChevronRight size={18} /></button><button type="button" onClick={load} className="rounded-full border bg-white p-2" aria-label="Yenile"><RefreshCw size={18} /></button></div></div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Haftalık rezervasyon defteri</p><h1 className="display mt-2 text-4xl font-extrabold">Rezervasyon kayıtları</h1><p className="mt-2 text-sm text-[var(--muted)]">{dateLabel(dates[0])} - {dateLabel(dates[6])}</p>{message && <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold text-[var(--green)]">{message}</p>}<div className="mt-8 grid gap-4 md:grid-cols-2">{dates.map((date) => { const dayBookings = bookings.filter((item) => item.booking_date === date); return <section key={date} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 border-b border-[var(--line)] pb-3 text-[var(--green)]"><CalendarDays size={17} /><h2 className="font-extrabold">{dateLabel(date)}</h2></div><div className="mt-4 space-y-3">{dayBookings.length ? dayBookings.map((item) => <article key={item.id} className="rounded-xl bg-[#f5f7f3] p-4"><p className="font-extrabold">{item.booking_time} · {item.customer_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.phone} · {item.package_name} · {item.duration_hours || 1} saat</p><div className="mt-3 flex items-center justify-between gap-2"><strong className="text-sm text-[var(--green)]">₺{item.total_amount}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">{statusLabels[item.payment_status] || item.payment_status}</span></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => updateStatus(item.id, "paid")} className="rounded-full bg-[var(--green)] px-2 py-1 text-[11px] font-bold text-white">Tamamı</button><button type="button" onClick={() => updateStatus(item.id, "deposit")} className="rounded-full bg-[#fff1c9] px-2 py-1 text-[11px] font-bold text-[#8a5a00]">Kapora</button><button type="button" onClick={() => updateStatus(item.id, "unpaid")} className="rounded-full border px-2 py-1 text-[11px] font-bold">Ödenmedi</button></div></article>) : <p className="text-sm text-[var(--muted)]">Kayıt yok.</p>}</div></section>; })}</div></div></main>;
}
