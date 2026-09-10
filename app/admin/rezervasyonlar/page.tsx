"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  total_amount: number;
  payment_status: string;
  subscriber: boolean;
};
type SubscriptionSlot = {
  id?: string;
  user_id: string;
  subscription_day: string;
  subscription_time: string;
  active: boolean;
  profile?: { email: string; full_name: string; phone: string; created_at: string } | null;
  completedWeeks?: number;
};
type ManualBooking = { booking_date: string; booking_time: string; customer_name: string; phone: string; total_amount: string; payment_status: string; notes: string };
const hours = Array.from({ length: 15 }, (_, index) => {
  const start = (index + 11) % 24;
  return `${String(start).padStart(2, "0")}.00-${String((start + 1) % 24).padStart(2, "0")}.00`;
});
const days = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const statusLabels: Record<string, string> = {
  paid: "Tamamı",
  approved: "Tamamı",
  deposit: "Kapora",
  proof_submitted: "Kapora",
  unpaid: "Ödenmedi",
  pending: "Ödenmedi",
  rejected: "Reddedildi",
};
const mondayOf = (date: Date) => {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
};
const iso = (date: Date) => date.toISOString().slice(0, 10);
const dateText = (date: Date) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(
    date,
  );

export default function AdminBookingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscriptionSlots, setSubscriptionSlots] = useState<
    SubscriptionSlot[]
  >([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionSlot | null>(null);
  const [manualBooking, setManualBooking] = useState<ManualBooking>({ booking_date: "", booking_time: "", customer_name: "", phone: "", total_amount: "1800", payment_status: "unpaid", notes: "" });
  const [savingManual, setSavingManual] = useState(false);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [now, setNow] = useState(() => new Date());
  const weekStart = useMemo(() => {
    const value = mondayOf(new Date());
    value.setDate(value.getDate() + weekOffset * 7);
    return value;
  }, [weekOffset]);
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const value = new Date(weekStart);
        value.setDate(value.getDate() + index);
        return iso(value);
      }),
    [weekStart],
  );
  const monthStart = useMemo(
    () => iso(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1, 12)),
    [weekStart],
  );
  const monthEnd = useMemo(
    () => iso(new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0, 12)),
    [weekStart],
  );
  useEffect(() => {
    setSelectedDate((current) => (dates.includes(current) ? current : dates[0]));
  }, [dates]);

  const load = async () => {
    const client = getSupabaseClient();
    const { data: assurance } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") {
      setMessage("Admin girişi ve 2FA gerekli.");
      return;
    }
    setAuthorized(true);
    const { data, error } = await client
      .from("booking_requests")
      .select(
        "id, customer_name, phone, booking_date, booking_time, duration_hours, total_amount, payment_status, subscriber",
      )
      .gte("booking_date", monthStart)
      .lte("booking_date", monthEnd)
      .order("booking_date")
      .order("booking_time");
    if (error) setMessage(error.message);
    else {
      setBookings(data || []);
      const { data: slots } = await client
        .from("subscription_slots")
        .select("id, user_id, subscription_day, subscription_time, active");
      const detailedSlots = await Promise.all((slots || []).map(async (slot) => {
        const { data: profile } = await client.from("profiles").select("email, full_name, phone, created_at").eq("id", slot.user_id).maybeSingle();
        const { count } = await client.from("booking_requests").select("id", { count: "exact", head: true }).eq("user_id", slot.user_id).in("payment_status", ["paid", "approved"]);
        return { ...slot, profile, completedWeeks: count || 0 };
      }));
      setSubscriptionSlots(detailedSlots);
      setMessage("");
    }
  };
  useEffect(() => {
    load().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Rezervasyonlar yüklenemedi.",
      ),
    );
  }, [dates, monthStart, monthEnd]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const bookingAt = (date: string, hour: string) =>
    bookings.find((item) => {
      if (item.booking_date !== date) return false;
      const start = Number(item.booking_time.slice(0, 2));
      const current = Number(hour.slice(0, 2));
      const duration = Math.max(Number(item.duration_hours || 1), 1);
      return current >= start && current < start + duration;
    });
  const subscriptionAt = (date: string, hour: string) => {
    const weekday = new Intl.DateTimeFormat("tr-TR", {
      weekday: "long",
    }).format(new Date(`${date}T12:00:00`));
    const startTime = hour.slice(0, 5).replace(".", ":");
    return subscriptionSlots.some(
      (slot) =>
        slot.active &&
        slot.subscription_day === weekday &&
        slot.subscription_time.startsWith(startTime),
    );
  };
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHour = `${String(now.getHours()).padStart(2, "0")}.00-${String((now.getHours() + 1) % 24).padStart(2, "0")}.00`;
  const summaryDate = dates.includes(localDate) ? localDate : dates[0];
  const weekBookings = bookings.filter((booking) => dates.includes(booking.booking_date));
  const summaryBookings = weekBookings.filter(
    (booking) => booking.booking_date === summaryDate,
  );
  const daytimeMatches = summaryBookings.filter((booking) => {
    const hour = Number(booking.booking_time.slice(0, 2));
    return hour >= 2 && hour < 18;
  }).length;
  const nighttimeMatches = summaryBookings.length - daytimeMatches;
  const dailyRevenue = summaryBookings.reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0,
  );
  const pendingBookings = weekBookings.filter((booking) =>
    ["pending", "proof_submitted", "deposit", "unpaid"].includes(booking.payment_status),
  ).length;
  const weeklyRevenue = weekBookings.reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0,
  );
  const monthlyRevenue = bookings.reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0,
  );
  const cancelledSubscribers = subscriptionSlots.filter((slot) => !slot.active).length;
  const activeSubscribers = subscriptionSlots.filter((slot) => slot.active).length;
  const dayTotal = (date: string) =>
    bookings
      .filter((booking) => booking.booking_date === date)
      .reduce((total, booking) => total + Number(booking.total_amount || 0), 0);
  const clock = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const openManual = (date = dates[0], hour = "18:00") => {
    setManualBooking({ booking_date: date, booking_time: hour, customer_name: "", phone: "", total_amount: Number(hour.slice(0, 2)) >= 18 || Number(hour.slice(0, 2)) < 2 ? "1800" : "1200", payment_status: "unpaid", notes: "" });
    setManualOpen(true);
  };
  const saveManual = async () => {
    if (!manualBooking.customer_name.trim() || !/^0\d{10}$/.test(manualBooking.phone.replace(/\s/g, ""))) { setMessage("Ad soyad ve 11 haneli telefon zorunlu."); return; }
    setSavingManual(true);
    const { data, error } = await getSupabaseClient().from("booking_requests").insert({ customer_name: manualBooking.customer_name.trim(), phone: manualBooking.phone.replace(/\s/g, ""), booking_date: manualBooking.booking_date, booking_time: manualBooking.booking_time, duration_hours: 1, package_name: "Manuel Rezervasyon", total_amount: Number(manualBooking.total_amount), deposit_amount: 0, payment_choice: "full", payment_status: manualBooking.payment_status, notes: manualBooking.notes }).select("id, customer_name, phone, booking_date, booking_time, duration_hours, total_amount, payment_status, subscriber").single();
    setSavingManual(false);
    if (error) { setMessage(error.message); return; }
    setBookings((current) => [...current, data]);
    setManualOpen(false);
  };

  if (!authorized)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} />
          <h1 className="display text-2xl font-extrabold">
            Yetkili admin girişi gerekli
          </h1>
          <a
            href="/admin"
            className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white"
          >
            Admin girişine git
          </a>
          <p className="mt-4 text-xs text-[var(--muted)]">{message}</p>
        </div>
      </main>
    );

  return (
    <main className="reservation-page min-h-screen bg-[#f5f7f3] px-3 py-6 text-[var(--ink)] sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <strong className="reservation-clock">{clock}</strong>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setWeekOffset((value) => value - 1)}
                className="rounded-full border bg-white p-2"
                aria-label="Önceki hafta"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((value) => value + 1)}
                className="rounded-full border bg-white p-2"
                aria-label="Sonraki hafta"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={load}
                className="rounded-full border bg-white p-2"
                aria-label="Yenile"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--green)]">
              Haftalık rezervasyon defteri
            </p>
            <h1 className="display mt-1 text-2xl font-extrabold sm:text-3xl">
              Rezervasyonlar
            </h1>
          </div>
          <p className="text-right text-xs text-[var(--muted)]">
            {dateText(weekStart)} -{" "}
            {dateText(new Date(weekStart.getTime() + 6 * 86400000))}
          </p>
        </div>
        <div className="admin-day-picker" aria-label="Defter günü seçimi">
          {dates.map((date, dayIndex) => (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={selectedDate === date ? "admin-day-picker-active" : ""}
            >
              <strong>{days[dayIndex]}</strong>
              <span>{date.slice(8, 10)}.{date.slice(5, 7)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="manual-booking-button mb-4" onClick={() => openManual()}><Plus size={17} /> Manuel Maç Ekle</button>
        <div className="reservation-summary mb-4 grid w-full grid-cols-2 gap-3">
          <div className="reservation-summary-card">
            <span>GÜNÜN HASILATI</span>
            <strong>₺{dailyRevenue.toLocaleString("tr-TR")}</strong>
            <small>{dateText(new Date(`${summaryDate}T12:00:00`))}</small>
          </div>
          <div className="reservation-summary-card">
            <span>TOPLAM HASILAT</span>
            <strong>₺{weeklyRevenue.toLocaleString("tr-TR")}</strong>
            <small>Seçilen haftanın toplamı</small>
          </div>
          <div className="reservation-summary-card">
            <span>AKTİF ABONE</span>
            <strong>{activeSubscribers}</strong>
            <small>Sistemdeki aktif sabit saat</small>
          </div>
          <div className="reservation-summary-card">
            <span>BEKLEYEN KAYIT</span>
            <strong>{pendingBookings}</strong>
            <small>Onay veya kapora bekleyen</small>
          </div>
          <div className="reservation-summary-card reservation-match-split">
            <div>
              <span>GÜNLÜK MAÇ</span>
              <strong>{summaryBookings.length}</strong>
            </div>
            <div>
              <span>GÜNDÜZ</span>
              <b>{daytimeMatches}</b>
            </div>
            <div>
              <span>GECE</span>
              <b>{nighttimeMatches}</b>
            </div>
          </div>
          <div className="reservation-summary-card">
            <span>TOPLAM MAÇ</span>
            <strong>{bookings.length}</strong>
            <small>Seçilen haftadaki toplam</small>
          </div>
        </div>
        {message && (
          <p className="mb-3 rounded-lg bg-white p-3 text-xs font-semibold text-[var(--green)]">
            {message}
          </p>
        )}
        <div className="reservation-scroll overflow-x-auto rounded-xl border border-[var(--line)] bg-white shadow-sm">
          <div className="reservation-grid min-w-[1280px]">
            <div className="reservation-corner">Gün / Saat</div>
            {hours.map((hour) => (
              <div
                key={hour}
                className={`reservation-hour ${localDate >= dates[0] && localDate <= dates[6] && hour === currentHour ? "reservation-hour-current" : ""}`}
              >
                {hour}
              </div>
            ))}
            <div className="reservation-hour reservation-total-heading">
              Toplam
            </div>
            {dates.filter((date) => date === selectedDate).map((date) => {
              const dayIndex = dates.indexOf(date);
              return (
              <div className="contents" key={date}>
                <div
                  className={`reservation-day ${date === localDate ? "reservation-day-current" : ""}`}
                >
                  <strong>{days[dayIndex]}</strong>
                  <span>
                    {date.slice(8, 10)}.{date.slice(5, 7)}
                  </span>
                </div>
                {hours.map((hour) => {
                  const booking = bookingAt(date, hour);
                  const subscription = subscriptionAt(date, hour);
                  const subscriptionInfo = subscriptionSlots.find((slot) => {
                    const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date(`${date}T12:00:00`));
                    return slot.active && slot.subscription_day === weekday && slot.subscription_time.startsWith(hour.slice(0, 5).replace(".", ":"));
                  });
                  const current = date === localDate && hour === currentHour;
                  return (
                    <div
                      key={`${date}-${hour}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const locked = subscriptionSlots.find((slot) => subscriptionAt(date, hour) && slot.subscription_day === new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date(`${date}T12:00:00`)) && slot.subscription_time.startsWith(hour.slice(0, 5).replace(".", ":")));
                        if (locked) setSelectedSubscription(locked);
                        else if (!booking) openManual(date, hour.slice(0, 5).replace(".", ":"));
                      }}
                      className={`reservation-cell ${current ? "reservation-cell-current" : ""} ${booking ? "reservation-cell-booked" : ""} ${booking?.subscriber ? "reservation-cell-subscriber" : ""} ${subscription && !booking ? "reservation-cell-subscription-locked" : ""}`}
                    >
                      {booking && (
                        <>
                          <strong>{booking.customer_name}</strong>
                          <span className="reservation-cell-phone">
                            {booking.phone}
                          </span>
                          <b>₺{booking.total_amount}</b>
                          <em>
                            {statusLabels[booking.payment_status] ||
                              booking.payment_status}
                          </em>
                        </>
                      )}
                      {subscription && !booking && (
                        <>
                          <strong>{subscriptionInfo?.profile?.full_name || "KİLİTLİ"}</strong>
                          <span>{subscriptionInfo?.profile?.phone || "Abonelik slotu"}</span>
                          <b>₺1.700</b>
                          <em>ABONE</em>
                        </>
                      )}
                    </div>
                  );
                })}
                <div className="reservation-total-cell">
                  ₺{dayTotal(date).toLocaleString("tr-TR")}
                </div>
              </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          Canlı saat sarı renkle işaretlenir. Dolu saatlerde takım kaptanı,
          telefon, ücret ve ödeme durumu görünür.
        </p>
        <section className="weekly-field-summary">
          <div className="weekly-field-summary-heading">
            <span>HAFTALIK SAHA ÖZETİ</span>
            <strong>
              {dateText(weekStart)} - {dateText(new Date(weekStart.getTime() + 6 * 86400000))}
            </strong>
          </div>
          <div><small>Toplam maç</small><b>{bookings.length}</b></div>
          <div><small>Toplam hasılat</small><b>₺{weeklyRevenue.toLocaleString("tr-TR")}</b></div>
          <div><small>Aktif abone</small><b>{activeSubscribers}</b></div>
        </section>
        <section className="weekly-field-summary monthly-field-summary">
          <div className="weekly-field-summary-heading">
            <span>AYLIK SAHA ÖZETİ</span>
            <strong>{new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(weekStart)}</strong>
          </div>
          <div><small>Toplam maç</small><b>{bookings.length}</b></div>
          <div><small>Toplam hasılat</small><b>₺{monthlyRevenue.toLocaleString("tr-TR")}</b></div>
          <div><small>Aktif abone</small><b>{activeSubscribers}</b></div>
          <div><small>İptal edilen abone</small><b>{cancelledSubscribers}</b></div>
        </section>
        {manualOpen && <div className="admin-modal-backdrop" onClick={() => setManualOpen(false)}><div className="admin-modal" onClick={(event) => event.stopPropagation()}><div className="admin-modal-heading"><div><p>YENİ KAYIT</p><h2>Manuel Rezervasyon Ekle</h2></div><button type="button" onClick={() => setManualOpen(false)}>×</button></div><div className="admin-modal-grid"><label>Gün<input type="date" value={manualBooking.booking_date} onChange={(event) => setManualBooking({ ...manualBooking, booking_date: event.target.value })} /></label><label>Saat<input type="time" value={manualBooking.booking_time} onChange={(event) => setManualBooking({ ...manualBooking, booking_time: event.target.value })} /></label><label className="admin-modal-wide">Takım Kaptanı / Müşteri<input value={manualBooking.customer_name} onChange={(event) => setManualBooking({ ...manualBooking, customer_name: event.target.value })} /></label><label>Telefon<input value={manualBooking.phone} onChange={(event) => setManualBooking({ ...manualBooking, phone: event.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="05xxxxxxxxx" /></label><label>Ücret<input type="number" value={manualBooking.total_amount} onChange={(event) => setManualBooking({ ...manualBooking, total_amount: event.target.value })} /></label><label>Ödeme Durumu<select value={manualBooking.payment_status} onChange={(event) => setManualBooking({ ...manualBooking, payment_status: event.target.value })}><option value="paid">Ödendi</option><option value="deposit">Kapora Alındı</option><option value="unpaid">Ödenmedi / Maç Sonu</option></select></label><label className="admin-modal-wide">Not / Açıklama<textarea value={manualBooking.notes} onChange={(event) => setManualBooking({ ...manualBooking, notes: event.target.value })} /></label></div><button type="button" className="admin-modal-save" onClick={saveManual} disabled={savingManual}>{savingManual ? "Kaydediliyor..." : "Kaydet"}</button></div></div>}
        {selectedSubscription && <div className="admin-modal-backdrop" onClick={() => setSelectedSubscription(null)}><div className="admin-modal subscription-detail-modal" onClick={(event) => event.stopPropagation()}><div className="admin-modal-heading"><div><p>GOLD ABONE</p><h2>{selectedSubscription.profile?.full_name || "Abone profili"}</h2></div><button type="button" onClick={() => setSelectedSubscription(null)}>×</button></div><div className="subscription-detail-list"><p><span>E-posta</span><strong>{selectedSubscription.profile?.email || "Kayıtlı e-posta yok"}</strong></p><p><span>Telefon</span><strong>{selectedSubscription.profile?.phone || "Telefon yok"}</strong></p><p><span>Kayıt tarihi</span><strong>{selectedSubscription.profile?.created_at ? new Intl.DateTimeFormat("tr-TR").format(new Date(selectedSubscription.profile.created_at)) : "-"}</strong></p><p><span>Toplam oynadığı hafta</span><strong>{selectedSubscription.completedWeeks || 0} hafta</strong></p></div></div></div>}
      </div>
    </main>
  );
}
