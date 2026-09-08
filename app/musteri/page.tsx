"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, LogOut, UserRound } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

type Profile = { full_name: string; phone: string; subscriber: boolean };

export default function CustomerPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", subscriber: false });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: savedProfile } = await client.from("profiles").select("full_name, phone, subscriber").eq("id", data.user.id).maybeSingle();
      setProfile(savedProfile);
    });
  }, []);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const client = getSupabaseClient();
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email: form.email, password: form.password });
        if (error) throw error;
        if (!data.user) throw new Error("Hesap oluşturulamadı.");
        if (data.session) {
          await client.from("profiles").upsert({ id: data.user.id, full_name: form.fullName, phone: form.phone, subscriber: form.subscriber });
          setProfile({ full_name: form.fullName, phone: form.phone, subscriber: form.subscriber });
        } else {
          setMessage("Hesabın oluşturuldu. E-postandaki doğrulama bağlantısına tıkla, sonra giriş yap.");
          setMode("login");
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        const { data: user } = await client.auth.getUser();
        const { data: savedProfile } = await client.from("profiles").select("full_name, phone, subscriber").eq("id", user.user?.id).maybeSingle();
        setProfile(savedProfile);
        setMessage("Giriş başarılı.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşlem başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setProfile(null);
    setForm({ email: "", password: "", fullName: "", phone: "", subscriber: false });
  };

  if (profile) return <main className="min-h-screen bg-[var(--cream)] px-5 py-12"><div className="mx-auto max-w-2xl"><a href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Ana sayfaya dön</a><section className="rounded-3xl bg-white p-8 shadow-sm sm:p-12"><div className="flex items-center justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><UserRound size={26} /></div><button onClick={signOut} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold"><LogOut size={16} /> Çıkış</button></div><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Müşteri hesabım</p><h1 className="display mt-3 text-4xl font-extrabold">Hoş geldin, {profile.full_name || "oyuncu"}.</h1><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f5f7f3] p-5"><p className="text-sm text-[var(--muted)]">Telefon</p><p className="mt-2 font-bold">{profile.phone || "Eklenmemiş"}</p></div><div className="rounded-2xl bg-[#f5f7f3] p-5"><p className="text-sm text-[var(--muted)]">Üyelik durumu</p><p className="mt-2 flex items-center gap-2 font-bold text-[var(--green)]">{profile.subscriber ? <><Check size={17} /> Aktif abone</> : "Normal müşteri"}</p></div></div><a href="/#rezervasyon" className="mt-8 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Rezervasyon yap</a></section></div></main>;
  return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><a href="/" className="mb-10 flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><LockKeyhole size={26} /></div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Bağmancı Halı Saha</p><h1 className="display mt-3 text-4xl font-extrabold">{mode === "login" ? "Müşteri girişi" : "Üyelik oluştur"}</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Rezervasyonlarını, aboneliğini ve avantajlarını hesabından takip et.</p>{mode === "signup" && <><label className="mt-8 block text-sm font-bold">Ad soyad<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label><label className="mt-4 block text-sm font-bold">Telefon<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label><label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.subscriber} onChange={(event) => setForm({ ...form, subscriber: event.target.checked })} className="h-4 w-4 accent-[var(--green)]" /> Abone olmak istiyorum</label></>}<label className="mt-4 block text-sm font-bold">E-posta<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label><label className="mt-4 block text-sm font-bold">Şifre<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label><button disabled={loading} onClick={submit} className="mt-6 w-full rounded-full bg-[var(--green)] px-5 py-4 text-sm font-extrabold text-white disabled:opacity-60">{loading ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Üye ol"}</button>{message && <p className="mt-4 rounded-xl bg-[#f5f7f3] p-3 text-sm font-semibold text-[var(--green)]">{message}</p>}<button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-6 w-full text-sm font-bold text-[var(--green)]">{mode === "login" ? "Hesabın yok mu? Üye ol" : "Zaten hesabın var mı? Giriş yap"}</button></div></main>;
}
