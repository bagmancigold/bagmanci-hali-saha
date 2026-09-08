"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, RefreshCw, Users } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Customer = { id: string; full_name: string; phone: string; subscriber: boolean; created_at: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("Yükleniyor...");

  const loadCustomers = async () => {
    try {
      const client = getSupabaseClient();
      const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.currentLevel !== "aal2") {
        setMessage("Bu sayfa için admin hesabı ve 2FA gerekir.");
        return;
      }
      const { data, error } = await client.from("profiles").select("id, full_name, phone, subscriber, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      setCustomers(data ?? []);
      setMessage(data?.length ? "" : "Henüz müşteri kaydı yok.");
    } catch {
      setMessage("Müşteri tablosu hazır değil veya erişim yetkiniz yok. Supabase SQL şemasını çalıştırın.");
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-5xl"><a href="/admin" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Müşteri yönetimi</p><h1 className="display text-4xl font-extrabold">Müşteriler ve aboneler</h1><p className="mt-2 text-sm text-[var(--muted)]">Kayıtlı müşterileri ve abone durumlarını görüntüle.</p></div><button onClick={loadCustomers} className="flex items-center gap-2 rounded-full bg-[var(--green)] px-4 py-3 text-sm font-bold text-white"><RefreshCw size={16} /> Yenile</button></div><section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-[var(--line)] p-6"><Users className="text-[var(--green)]" /><span className="font-bold">Toplam müşteri: {customers.length}</span></div>{message && <p className="p-6 text-sm text-[var(--muted)]">{message}</p>}{customers.length > 0 && <div className="divide-y divide-[var(--line)]">{customers.map((customer) => <div key={customer.id} className="grid gap-3 p-6 sm:grid-cols-[1fr_1fr_180px]"><div><p className="font-bold">{customer.full_name || "İsimsiz müşteri"}</p><p className="mt-1 text-xs text-[var(--muted)]">Kayıt: {new Date(customer.created_at).toLocaleDateString("tr-TR")}</p></div><p className="text-sm text-[var(--muted)]">{customer.phone || "Telefon eklenmemiş"}</p><span className={`flex h-fit w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${customer.subscriber ? "bg-[#e5f5bf] text-[var(--green)]" : "bg-[#f1f3ef] text-[var(--muted)]"}`}>{customer.subscriber && <Check size={14} />}{customer.subscriber ? "Abone" : "Müşteri"}</span></div>)}</div>}</section><p className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]"><LockKeyhole size={14} /> Müşteri bilgileri yalnızca MFA doğrulaması yapılmış admin hesabına açıktır.</p></div></main>;
}
