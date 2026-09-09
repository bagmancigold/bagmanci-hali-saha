"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Booking = { id: string; customer_name: string; phone: string; booking_date: string; booking_time: string; package_name: string; total_amount: number; deposit_amount: number; paid_amount: number; payment_choice: string; payment_status: string };

const statusLabels: Record<string, string> = { pending: "Ödeme bekliyor", proof_submitted: "Dekont incelenecek", paid: "Ödendi", approved: "Onaylandı", rejected: "Reddedildi" };

export default function AdminPaymentsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState<Booking[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Kontrol ediliyor...");

  const load = async () => {
    try {
      const client = getSupabaseClient();
      const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel !== "aal2") { setMessage("Admin girişi ve 2FA gerekli."); return; }
      setAuthorized(true);
      const { data, error } = await client.from("booking_requests").select("id, customer_name, phone, booking_date, booking_time, package_name, total_amount, deposit_amount, paid_amount, payment_choice, payment_status").order("booking_date", { ascending: false });
      if (error) throw error;
      setItems(data || []);
      setAmounts(Object.fromEntries((data || []).map((item) => [item.id, String(item.paid_amount || 0)])));
      setMessage(data?.length ? "" : "Henüz rezervasyon yok.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ödemeler yüklenemedi."); }
  };

  useEffect(() => { load(); }, []);

  const save = async (item: Booking, status: string) => {
    const paid = Number(amounts[item.id] || 0);
    const { error } = await getSupabaseClient().from("booking_requests").update({ paid_amount: paid, payment_status: status }).eq("id", item.id);
    if (error) { setMessage(error.message); return; }
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, paid_amount: paid, payment_status: status } : currentItem));
    setMessage("Ödeme bilgisi kaydedildi.");
  };

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Ödeme yönetimi için admin hesabıyla giriş yapıp 2FA kodunu doğrula.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-6xl"><div className="mb-10 flex items-center justify-between"><a href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold"><RefreshCw size={15} /> Yenile</button></div><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Finans yönetimi</p><h1 className="display mt-3 text-4xl font-extrabold">Ödeme sistemi</h1><p className="mt-2 text-sm text-[var(--muted)]">Rezervasyon saatinin altında toplam, ödenen ve kalan tutarı takip et.</p></div>{message && <p className="mb-6 rounded-xl bg-white p-4 text-sm font-semibold text-[var(--green)]">{message}</p>}<div className="space-y-4">{items.map((item) => { const paid = Number(amounts[item.id] || 0); const remaining = Math.max(Number(item.total_amount || 0) - paid, 0); return <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-extrabold">{item.customer_name} · {item.phone}</p><p className="mt-2 text-sm font-bold text-[var(--green)]">{item.booking_date} · {item.booking_time} · {item.package_name}</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-[#f5f7f3] p-3"><span className="block text-[11px] font-bold uppercase text-[var(--muted)]">Toplam</span><strong>₺{item.total_amount}</strong></div><div className="rounded-xl bg-[#eaf5d1] p-3"><span className="block text-[11px] font-bold uppercase text-[var(--green)]">Ödenen</span><strong>₺{paid}</strong></div><div className="rounded-xl bg-[#fff4d8] p-3"><span className="block text-[11px] font-bold uppercase text-[#8a6200]">Kalan</span><strong>₺{remaining}</strong></div></div></div><div className="min-w-[260px] rounded-2xl border border-[var(--line)] p-4"><label className="text-xs font-bold text-[var(--muted)]">Ödenen tutarı güncelle<input type="number" min="0" value={amounts[item.id] || "0"} onChange={(event) => setAmounts({ ...amounts, [item.id]: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-bold outline-none focus:border-[var(--green)]" /></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => save(item, "paid")} className="inline-flex items-center gap-1 rounded-full bg-[var(--green)] px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Ödendi</button><button type="button" onClick={() => save(item, "proof_submitted")} className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold"><CreditCard size={14} /> Kısmi</button><button type="button" onClick={() => save(item, "pending")} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold">Bekliyor</button></div><p className="mt-3 text-xs font-bold text-[var(--green)]">{statusLabels[item.payment_status] || item.payment_status}</p></div></div></article>; })}</div></div></main>;
}
