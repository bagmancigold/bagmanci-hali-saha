"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Chrome, LockKeyhole, LogOut, Phone, UserRound } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

type Profile = { username: string; full_name: string; phone: string; subscriber: boolean };
type Mode = "login" | "signup";
type Form = { username: string; email: string; password: string; fullName: string; phone: string; subscriber: boolean };

const blankForm: Form = { username: "", email: "", password: "", fullName: "", phone: "", subscriber: false };

export default function CustomerPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<Form>(blankForm);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const setField = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const loadProfile = async () => {
    const client = getSupabaseClient();
    const { data: userData } = await client.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await client.from("profiles").select("username, full_name, phone, subscriber").eq("id", userData.user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Bu hesap için üyelik profili bulunamadı.");
    setProfile(data);
  };

  useEffect(() => { loadProfile().catch(() => undefined); }, []);

  const submit = async () => {
    const missingSignup = mode === "signup" && (!form.username.trim() || !form.fullName.trim() || !form.email.trim() || !form.password || !/^0\d{10}$/.test(form.phone.replace(/\D/g, "")));
    const missingLogin = mode === "login" && (!form.email.trim() || !form.password);
    if (missingSignup) { setMessage("Kullanıcı adı, ad soyad, e-posta, şifre ve 11 haneli telefon zorunlu."); return; }
    if (mode === "signup" && !phoneVerified) { setMessage("Üyelik için telefonuna gelen WhatsApp kodunu doğrula."); return; }
    if (missingLogin) { setMessage("E-posta ve şifre zorunlu."); return; }
    setLoading(true); setMessage("");
    try {
      const client = getSupabaseClient();
      if (mode === "signup") {
        const cleanPhone = form.phone.replace(/\D/g, "");
        const { data, error } = await client.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { username: form.username.trim(), full_name: form.fullName.trim(), phone: cleanPhone, phone_verified: true } } });
        if (error) throw error;
        if (!data.user) throw new Error("Üyelik oluşturulamadı.");
        if (!data.session) { setMode("login"); setMessage("Üyeliğin oluşturuldu. E-postandaki doğrulama bağlantısından sonra giriş yap."); return; }
        const { error: profileError } = await client.from("profiles").upsert({ id: data.user.id, email: data.user.email || form.email.trim(), username: form.username.trim(), full_name: form.fullName.trim(), phone: cleanPhone, phone_verified: true, phone_verified_at: new Date().toISOString(), subscriber: form.subscriber });
        if (profileError) throw profileError;
      } else {
        const { error } = await client.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw error;
      }
      window.location.href = "/hesabim";
    } catch (error) { setMessage(error instanceof Error ? error.message : "İşlem başarısız oldu."); }
    finally { setLoading(false); }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    setLoading(true); setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/hesabim` } });
      if (error) throw error;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sosyal giriş başlatılamadı."); setLoading(false); }
  };

  const phoneLogin = async () => {
    if (!form.phone.trim()) { setMessage("Telefon numaranı yaz."); return; }
    setLoading(true); setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithOtp({ phone: form.phone.trim() });
      if (error) throw error;
      setPhoneCodeSent(true);
      setMessage("Telefonuna gelen doğrulama kodunu girerek üyeliğini doğrula.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Telefon girişi başlatılamadı."); }
    finally { setLoading(false); }
  };

  const sendWhatsAppCode = async () => {
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!/^0\d{10}$/.test(cleanPhone)) { setMessage("Önce 05xxxxxxxxx formatında telefon numaranı yaz."); return; }
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/whatsapp/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "WhatsApp kodu gönderilemedi.");
      setPhoneCodeSent(true);
      setMessage("WhatsApp doğrulama kodu gönderildi. Kod 10 dakika geçerli.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "WhatsApp kodu gönderilemedi."); }
    finally { setLoading(false); }
  };

  const verifyWhatsAppCode = async () => {
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!/^0\d{10}$/.test(cleanPhone) || !/^\d{6}$/.test(whatsappCode)) { setMessage("Telefon ve 6 haneli WhatsApp kodu gerekli."); return; }
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/whatsapp/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: whatsappCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kod doğrulanamadı.");
      setPhoneVerified(true);
      setMessage("Telefon doğrulandı. Üyeliğini oluşturabilirsin.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kod doğrulanamadı."); }
    finally { setLoading(false); }
  };

  const verifyPhone = async () => {
    if (!form.phone.trim() || !form.password.trim()) { setMessage("Telefon ve doğrulama kodu zorunlu."); return; }
    setLoading(true); setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.verifyOtp({ phone: form.phone.trim(), token: form.password.trim(), type: "sms" });
      if (error) throw error;
      await loadProfile();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kod doğrulanamadı."); }
    finally { setLoading(false); }
  };

  const signOut = async () => { await getSupabaseClient().auth.signOut(); setProfile(null); setForm(blankForm); };

  if (profile) return <main className="customer-page min-h-screen px-5 py-10"><div className="mx-auto max-w-3xl"><a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><section className="customer-panel rounded-[28px] bg-white p-7 shadow-xl sm:p-12"><div className="flex items-center justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><UserRound size={26} /></div><button type="button" onClick={signOut} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold"><LogOut size={16} /> Çıkış</button></div><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Oyuncu hesabı</p><h1 className="display mt-3 text-4xl font-extrabold">Hoş geldin, {profile.username || profile.full_name || "oyuncu"}.</h1><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f5f7f3] p-5"><p className="text-sm text-[var(--muted)]">Telefon</p><p className="mt-2 font-bold">{profile.phone || "Eklenmemiş"}</p></div><div className="rounded-2xl bg-[#f5f7f3] p-5"><p className="text-sm text-[var(--muted)]">Üyelik</p><p className="mt-2 flex items-center gap-2 font-bold text-[var(--green)]">{profile.subscriber ? <><Check size={17} /> Aktif abone</> : "Standart üyelik"}</p></div></div><a href="/#rezervasyon" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Rezervasyon yap <ArrowRight size={16} /></a></section></div></main>;

  return <main className="customer-page min-h-screen px-5 py-8 sm:px-8 sm:py-12"><div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]"><div className="customer-art relative hidden min-h-[600px] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[var(--lime)]">BAĞMANCI HALI SAHA</p><h1 className="display mt-5 max-w-sm text-6xl font-extrabold leading-[.9]">Takımını kur.<br /><span className="text-[var(--lime)]">Sahaya çık.</span></h1></div><div><p className="max-w-sm text-lg leading-7 text-white/75">Rezervasyonlarını ve maç avantajlarını tek oyuncu hesabından yönet.</p><div className="mt-8 flex items-center gap-3 text-sm font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--green)]"><Phone size={19} /></span> Maçın adresi belli.</div></div></div><div className="p-7 sm:p-12 lg:p-16"><a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><div className="mt-12 max-w-lg"><div className="mb-6 flex items-center gap-2"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><LockKeyhole size={23} /></span><p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--green)]">Oyuncu alanı</p></div><h2 className="display text-5xl font-extrabold leading-none">{mode === "login" ? "Tekrar sahaya dön." : "Kendi takım hesabını aç."}</h2><p className="mt-4 max-w-md text-base leading-7 text-[var(--muted)]">Üye olmadan giriş yok. Hesabını oluştur, sonra rezervasyonlarını takip et.</p><div className="mt-8 flex gap-2 rounded-full bg-[#f3f6f0] p-1"><button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`flex-1 rounded-full px-4 py-3 text-sm font-bold ${mode === "login" ? "bg-[var(--green)] text-white" : "text-[var(--muted)]"}`}>Giriş yap</button><button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={`flex-1 rounded-full px-4 py-3 text-sm font-bold ${mode === "signup" ? "bg-[var(--green)] text-white" : "text-[var(--muted)]"}`}>Üye ol</button></div>{mode === "signup" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Kullanıcı adı<input value={form.username} onChange={(event) => setField("username", event.target.value)} placeholder="takimkaptani" className="customer-input" /></label><label className="text-sm font-bold">Ad soyad<input value={form.fullName} onChange={(event) => setField("fullName", event.target.value)} placeholder="Adın soyadın" className="customer-input" /></label></div>}<label className="mt-4 block text-sm font-bold">E-posta<input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="ornek@mail.com" className="customer-input" /></label><label className="mt-4 block text-sm font-bold">Şifre<input type="password" value={form.password} onChange={(event) => setField("password", event.target.value)} placeholder="En az 6 karakter" className="customer-input" /></label>{mode === "signup" && <><label className="mt-4 block text-sm font-bold">Telefon<input value={form.phone} onChange={(event) => { setField("phone", event.target.value.replace(/\D/g, "").slice(0, 11)); setPhoneVerified(false); }} placeholder="05xx xxx xx xx" className="customer-input" /></label><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_.8fr]"><button type="button" disabled={loading || phoneVerified} onClick={sendWhatsAppCode} className="customer-social-button"><Phone size={17} /> WhatsApp kodu gönder</button><div className="flex gap-2"><input value={whatsappCode} onChange={(event) => setWhatsappCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 haneli kod" className="customer-input !mt-0" /><button type="button" disabled={loading || !phoneCodeSent || phoneVerified} onClick={verifyWhatsAppCode} className="customer-social-button shrink-0">{phoneVerified ? <Check size={17} /> : "Onayla"}</button></div></div></>}{mode === "signup" && <label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.subscriber} onChange={(event) => setField("subscriber", event.target.checked)} className="h-4 w-4 accent-[var(--green)]" /> Abone avantajlarını aç</label>}<button type="button" disabled={loading} onClick={submit} className="customer-primary-button mt-6">{loading ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Üyeliği oluştur"}<ArrowRight size={17} /></button><div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--line)]" /> veya <span className="h-px flex-1 bg-[var(--line)]" /></div><div className="grid gap-3 sm:grid-cols-3"><button type="button" disabled={loading} onClick={() => socialLogin("google")} className="customer-social-button"><Chrome size={17} /> Google</button><button type="button" disabled={loading} onClick={() => socialLogin("facebook")} className="customer-social-button"><span className="text-lg font-extrabold">f</span> Facebook</button><button type="button" disabled={loading} onClick={phoneLogin} className="customer-social-button"><Phone size={17} /> Telefon</button></div>{message && <p className="mt-5 rounded-2xl bg-[#f3f6f0] p-4 text-sm font-semibold leading-6 text-[var(--green)]">{message}</p>}</div></div></div></main>;
}
