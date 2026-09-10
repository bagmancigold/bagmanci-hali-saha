"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = { id: string; customer_name: string; phone: string; booking_date: string; booking_time: string; duration_hours: number; total_amount: number; payment_status: string };
const hours = Array.from({ length: 17 }, (_, index) => `${String((index + 9) % 24).padStart(2, "0")}:00`);
const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const statusLabels: Record<string, string> = { paid: "Tamamı", approved: "Tamamı", deposit: "Kapora", proof_submitted: "Kapora", unpaid: "Ödenmedi", pending: "Ödenmedi", rejected: "Reddedildi" };
const mondayOf = (date: Date) => { const value = new Date(date); value.setHours(12, 0, 0, 0); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return value; };
const iso = (date: Date) => date.toISOString().slice(0, 10);
const dateText = (date: Date) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(date);

export default function AdminBookingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [now, setNow] = useState(() => new Date());
  const weekStart = useMemo(() => { const value = mondayOf(new Date()); value.setDate(value.getDate() + weekOffset * 7); return value; }, [weekOffset]);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const value = new Date(weekStart); value.setDate(value.getDate() + index); return iso(value); }), [weekStart]);

  const load = async () => {
    const client = getSupabaseClient();
    const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") { setMessage("Admin girişi ve 2FA gerekli."); return; }
    setAuthorized(true);
    const { data, error } = await client.from("booking_requests").select("id, customer_name, phone, booking_date, booking_time, duration_hours, total_amount, payment_status").gte("booking_date", dates[0]).lte("booking_date", dates[6]).order("booking_date").order("booking_time");
    if (error) setMessage(error.message); else { setBookings(data || []); setMessage(""); }
  };
  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "Rezervasyonlar yüklenemedi.")); }, [dates]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);

  const bookingAt = (date: string, hour: string) => bookings.find((item) => {
    if (item.booking_date !== date) return false;
    const start = Number(item.booking_time.slice(0, 2));
    const current = Number(hour.slice(0, 2));
    const duration = Math.max(Number(item.duration_hours || 1), 1);
    return current >= start && current < start + duration;
  });
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHour = `${String(now.getHours()).padStart(2, "0")}:00`;
  const clock = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="reservation-page min-h-screen bg-[#f5f7f3] px-3 py-6 text-[var(--ink)] sm:px-5 lg:px-8"><div className="mx-auto max-w-[1600px]"><div className="mb-5 flex items-center justify-between"><a href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--green)]"><ArrowLeft size={15} /> Admin paneline dön</a><div className="flex items-center gap-2"><strong className="reservation-clock">{clock}</strong><div className="flex gap-1.5"><button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="rounded-full border bg-white p-2" aria-label="Önceki hafta"><ChevronLeft size={16} /></button><button type="button" onClick={() => setWeekOffset((value) => value + 1)} className="rounded-full border bg-white p-2" aria-label="Sonraki hafta"><ChevronRight size={16} /></button><button type="button" onClick={load} className="rounded-full border bg-white p-2" aria-label="Yenile"><RefreshCw size={16} /></button></div></div></div><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--green)]">Haftalık rezervasyon defteri</p><h1 className="display mt-1 text-2xl font-extrabold sm:text-3xl">Rezervasyonlar</h1></div><p className="text-right text-xs text-[var(--muted)]">{dateText(weekStart)} - {dateText(new Date(weekStart.getTime() + 6 * 86400000))}</p></div>{message && <p className="mb-3 rounded-lg bg-white p-3 text-xs font-semibold text-[var(--green)]">{message}</p>}<div className="reservation-scroll overflow-x-auto rounded-xl border border-[var(--line)] bg-white shadow-sm"><div className="reservation-grid min-w-[1280px]"><div className="reservation-corner">Gün / Saat</div>{hours.map((hour) => <div key={hour} className={`reservation-hour ${localDate >= dates[0] && localDate <= dates[6] && hour === currentHour ? "reservation-hour-current" : ""}`}>{hour}</div>)}{dates.map((date, dayIndex) => <div className="contents" key={date}><div className={`reservation-day ${date === localDate ? "reservation-day-current" : ""}`}><strong>{days[dayIndex]}</strong><span>{date.slice(8, 10)}.{date.slice(5, 7)}</span></div>{hours.map((hour) => { const booking = bookingAt(date, hour); const current = date === localDate && hour === currentHour; return <div key={`${date}-${hour}`} className={`reservation-cell ${current ? "reservation-cell-current" : ""} ${booking ? "reservation-cell-booked" : ""}`}>{booking && <><strong>{booking.customer_name}</strong><span>{booking.phone}</span><b>₺{booking.total_amount}</b><em>{statusLabels[booking.payment_status] || booking.payment_status}</em></>}</div>; })}</div>)}</div></div><p className="mt-3 text-[11px] text-[var(--muted)]">Canlı saat sarı renkle işaretlenir. Dolu saatlerde takım kaptanı, telefon, ücret ve ödeme durumu görünür.</p></div></main>;
}
