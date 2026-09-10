"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, RefreshCw, X } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  package_name: string;
  total_amount: number;
  deposit_amount: number;
  payment_choice: string;
  payment_status: string;
  notes: string;
  created_at: string;
};
const paymentLabels: Record<string, string> = {
  paid: "Tamamı ödendi",
  approved: "Tamamı ödendi",
  deposit: "Kapora ödendi",
  proof_submitted: "Kapora bildirildi",
  unpaid: "Ödenmedi",
  pending: "Ödenmedi",
  rejected: "Reddedildi",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Yükleniyor...");
  const load = async () => {
    try {
      const client = getSupabaseClient();
      const { data: assurance } =
        await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel !== "aal2") {
        setMessage("Admin girişi ve 2FA gerekli.");
        return;
      }
      const { data, error } = await client
        .from("booking_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
      setMessage(data?.length ? "" : "Henüz ödeme talebi yok.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Talepler yüklenemedi.",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const updateStatus = async (id: string, payment_status: string) => {
    const { error } = await getSupabaseClient()
      .from("booking_requests")
      .update({ payment_status })
      .eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setBookings((current) =>
      current.map((item) =>
        item.id === id ? { ...item, payment_status } : item,
      ),
    );
  };
  return (
    <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"
          >
            <ArrowLeft size={16} /> Admin paneline dön
          </a>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold"
          >
            <RefreshCw size={15} /> Yenile
          </button>
        </div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">
          Kontrol merkezi
        </p>
        <h1 className="display mt-3 text-4xl font-extrabold">
          Maç kayıt talepleri
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Müşterilerin ödeme ve dekont durumunu buradan yönet.
        </p>
        {message && (
          <p className="mt-6 rounded-xl bg-white p-4 text-sm font-semibold text-[var(--green)]">
            {message}
          </p>
        )}
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <p className="font-extrabold">
                    {booking.customer_name} · {booking.phone}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {booking.booking_date} · {booking.booking_time} ·{" "}
                    {booking.package_name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Ödeme:{" "}
                    {booking.payment_choice === "full"
                      ? `Tamamı ₺${booking.total_amount}`
                      : "Kapora ₺600"}{" "}
                    · Durum: {paymentLabels[booking.payment_status] || booking.payment_status}{" "}
                    {booking.notes && `· ${booking.notes}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f3f6f0] px-3 py-2 text-xs font-bold text-[var(--green)]">
                    {paymentLabels[booking.payment_status] || booking.payment_status}
                  </span>
                  <button type="button" onClick={() => updateStatus(booking.id, "paid")} className="rounded-full bg-[var(--green)] px-3 py-2 text-xs font-bold text-white"><Check size={14} className="mr-1 inline" /> Tamamı ödendi</button>
                  <button type="button" onClick={() => updateStatus(booking.id, "deposit")} className="rounded-full bg-[#fff1c9] px-3 py-2 text-xs font-bold text-[#8a5a00]">Kapora</button>
                  <button type="button" onClick={() => updateStatus(booking.id, "unpaid")} className="rounded-full border px-3 py-2 text-xs font-bold">Ödenmedi</button>
                  <button
                    type="button"
                    onClick={() => updateStatus(booking.id, "rejected")}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700"
                  >
                    <X size={14} /> Reddet
                  </button>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                <Clock3 size={14} />{" "}
                {new Date(booking.created_at).toLocaleString("tr-TR")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
