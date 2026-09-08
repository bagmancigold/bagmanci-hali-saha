"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, DollarSign, LockKeyhole, Menu, Phone, Settings, ShieldCheck, Trophy, Users, X } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

const initialBookings = [
  { time: "18:00", name: "Mehmet Kaya", phone: "0545 123 45 67", package: "Gece Tarifesi", status: "Onaylandı" },
  { time: "19:00", name: "Ahmet Yılmaz", phone: "0414 222 33 44", package: "Gece Tarifesi", status: "Bekliyor" },
  { time: "20:00", name: "Bağmancı FC", phone: "0545 333 22 11", package: "Maç Kaydı", status: "Onaylandı" }
];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaMode, setMfaMode] = useState<"verify" | "enroll" | null>(null);
  const [bookings, setBookings] = useState(initialBookings);
  const [fieldOpen, setFieldOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let client;
    try {
      client = getSupabaseClient();
    } catch {
      return;
    }

    const syncAssurance = async () => {
      const { data } = await client.auth.getAuthenticatorAssuranceLevel();
      setLoggedIn(data.currentLevel === "aal2");
    };
    syncAssurance();
    const now = new Date();
    const nextLogout = new Date(now);
    nextLogout.setHours(3, 0, 0, 0);
    if (nextLogout <= now) nextLogout.setDate(nextLogout.getDate() + 1);
    const logoutTimer = window.setTimeout(async () => {
      await client.auth.signOut();
      setLoggedIn(false);
      setMfaMode(null);
      setLoginError("Güvenlik nedeniyle admin oturumunuz saat 03:00'te kapatıldı.");
    }, nextLogout.getTime() - now.getTime());
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) setLoggedIn(false);
    });
    return () => {
      window.clearTimeout(logoutTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithPassword({ email: loginForm.username.trim(), password: loginForm.password });
      if (error) {
        setLoginError(`Supabase: ${error.message}`);
        return;
      }
      const { data: factors } = await client.auth.mfa.listFactors();
      const factor = factors?.totp.find((item) => item.status === "verified");
      if (factor) {
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
        if (challengeError) throw challengeError;
        setMfaFactorId(factor.id);
        setMfaChallengeId(challenge.id);
        setMfaMode("verify");
        setLoginError("");
        return;
      }
      const { data: enrollment, error: enrollmentError } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Bağmancı Admin" });
      if (enrollmentError) throw enrollmentError;
      setMfaFactorId(enrollment.id);
      setMfaQrCode(enrollment.totp.qr_code);
      setMfaSecret(enrollment.totp.secret);
      setMfaMode("enroll");
      setLoginError("");
    } catch {
      setLoginError("MFA kurulamadı. Supabase Auth ayarlarını ve Vercel değişkenlerini kontrol edin.");
    }
  };

  const verifyMfa = async () => {
    if (!mfaCode || !mfaFactorId) {
      setLoginError("6 haneli doğrulama kodunu girin.");
      return;
    }
    try {
      const client = getSupabaseClient();
      let challengeId = mfaChallengeId;
      if (mfaMode === "enroll") {
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: mfaFactorId });
        if (challengeError) throw challengeError;
        challengeId = challenge.id;
      }
      const { error } = await client.auth.mfa.verify({ factorId: mfaFactorId, challengeId, code: mfaCode });
      if (error) throw error;
      setLoggedIn(true);
      setMfaMode(null);
      setMfaCode("");
      setLoginError("");
    } catch {
      setLoginError("Kod hatalı veya süresi doldu. Yeni bir kod deneyin.");
    }
  };

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setLoggedIn(false);
    setMfaMode(null);
  };

  const updateBooking = (index: number, status: string) => {
    setBookings((current) => current.map((booking, bookingIndex) => bookingIndex === index ? { ...booking, status } : booking));
    setNotice(`Rezervasyon ${status.toLowerCase()} olarak güncellendi.`);
  };

  if (!loggedIn && mfaMode) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><ShieldCheck size={26} /></div><h1 className="display text-3xl font-extrabold">İki aşamalı doğrulama</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{mfaMode === "enroll" ? "Authenticator uygulamasını açıp QR kodu okutun, sonra 6 haneli kodu girin." : "Authenticator uygulamanızdaki 6 haneli kodu girin."}</p>{mfaQrCode && <img src={mfaQrCode} alt="MFA QR kodu" className="mx-auto my-6 h-48 w-48 rounded-xl" />}{mfaSecret && <p className="break-all rounded-xl bg-[#f5f7f3] p-3 text-xs text-[var(--muted)]">Kurulum anahtarı: {mfaSecret}</p>}<input inputMode="numeric" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} className="mt-6 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-center text-xl tracking-[.4em] outline-none focus:border-[var(--green)]" placeholder="000000" /><button onClick={verifyMfa} className="mt-5 w-full rounded-full bg-[var(--green)] px-5 py-4 text-sm font-extrabold text-white">Kodu doğrula</button>{loginError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{loginError}</p>}</div></main>;

  if (!loggedIn) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><a href="/" className="mb-10 flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Siteye dön</a><div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lime)] text-[var(--green)]"><LockKeyhole size={26} /></div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Bağmancı Halı Saha</p><h1 className="display mt-3 text-4xl font-extrabold">Admin girişi</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Rezervasyonları ve saha ayarlarını yönetmek için giriş yap.</p><label className="mt-8 block text-sm font-bold">E-posta<input type="email" value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" placeholder="admin@ornek.com" /></label><label className="mt-4 block text-sm font-bold">Şifre<input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" placeholder="Şifreniz" /></label><button onClick={handleLogin} className="mt-6 w-full rounded-full bg-[var(--green)] px-5 py-4 text-sm font-extrabold text-white">Giriş yap</button>{loginError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{loginError}</p>}</div></main>;

  return <main className="min-h-screen bg-[#f5f7f3] text-[var(--ink)]"><header className="border-b border-[var(--line)] bg-[var(--green)] px-5 py-5 text-white lg:px-10"><div className="mx-auto flex max-w-[1280px] items-center justify-between"><a href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--green)]"><Trophy size={19} /></span><span className="font-extrabold">Bağmancı yönetim</span></a><button aria-label="Menüyü aç" className="rounded-lg border border-white/20 p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button><nav className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-20 z-10 flex-col gap-4 rounded-xl bg-white p-5 text-[var(--ink)] shadow-xl md:static md:flex md:flex-row md:items-center md:gap-6 md:bg-transparent md:p-0 md:text-white md:shadow-none`}><a href="/" className="flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Siteye dön</a><a href="#rezervasyonlar" className="text-sm">Rezervasyonlar</a><a href="#ayarlar" className="text-sm">Ayarlar</a></nav></div></header><div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-10"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Kontrol merkezi</p><h1 className="display text-4xl font-extrabold sm:text-5xl">Bugünün saha özeti</h1><p className="mt-3 text-[var(--muted)]">Rezervasyonlarını ve saha durumunu tek yerden yönet.</p></div><div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${fieldOpen ? "bg-[#e5f5bf] text-[var(--green)]" : "bg-red-100 text-red-700"}`}><span className="h-2 w-2 rounded-full bg-current" /> Saha {fieldOpen ? "açık" : "kapalı"}</div></div><div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-white p-5 shadow-sm"><CalendarDays className="mb-5 text-[var(--green)]" size={20} /><p className="text-sm text-[var(--muted)]">Bugünkü maç</p><strong className="display text-3xl">8</strong></div><div className="rounded-2xl bg-white p-5 shadow-sm"><DollarSign className="mb-5 text-[var(--green)]" size={20} /><p className="text-sm text-[var(--muted)]">Günlük ciro</p><strong className="display text-3xl">₺1.600</strong></div><div className="rounded-2xl bg-white p-5 shadow-sm"><Users className="mb-5 text-[var(--green)]" size={20} /><p className="text-sm text-[var(--muted)]">Aktif abone</p><strong className="display text-3xl">42</strong></div><div className="rounded-2xl bg-white p-5 shadow-sm"><Clock3 className="mb-5 text-[var(--green)]" size={20} /><p className="text-sm text-[var(--muted)]">Bekleyen kayıt</p><strong className="display text-3xl">{bookings.filter((booking) => booking.status === "Bekliyor").length}</strong></div></div><section id="rezervasyonlar" className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] p-6 sm:flex-row sm:items-center"><div><h2 className="display text-2xl font-extrabold">Bugünün rezervasyonları</h2><p className="mt-1 text-sm text-[var(--muted)]">12 Haziran · Saha 1</p></div><button onClick={() => setNotice("Yeni rezervasyon alanı yakında açılacak.")} className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-bold text-white">+ Manuel kayıt</button></div><div className="divide-y divide-[var(--line)]">{bookings.map((booking, index) => <div key={`${booking.time}-${booking.name}`} className="grid gap-4 p-6 md:grid-cols-[90px_1fr_150px_180px] md:items-center"><div className="display text-xl font-extrabold text-[var(--green)]">{booking.time}</div><div><p className="font-bold">{booking.name}</p><p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]"><Phone size={14} /> {booking.phone} · {booking.package}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${booking.status === "Onaylandı" ? "bg-[#e5f5bf] text-[var(--green)]" : "bg-[#fff1c9] text-[#8a5a00]"}`}>{booking.status}</span><div className="flex gap-2"><button aria-label={`${booking.name} kaydını onayla`} onClick={() => updateBooking(index, "Onaylandı")} className="rounded-full bg-[var(--green)] p-2 text-white"><Check size={16} /></button><button aria-label={`${booking.name} kaydını iptal et`} onClick={() => updateBooking(index, "İptal edildi")} className="rounded-full bg-red-100 p-2 text-red-700"><X size={16} /></button></div></div>)}</div>{notice && <p className="border-t border-[var(--line)] bg-[#f5f7f3] px-6 py-4 text-sm font-semibold text-[var(--green)]">{notice}</p>}</section><section id="ayarlar" className="mt-8 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-[var(--green)] p-6 text-white"><ShieldCheck className="mb-5 text-[var(--lime)]" /><h2 className="display text-2xl font-extrabold">Saha durumu</h2><p className="mt-2 text-sm text-white/65">Yeni rezervasyon kabulünü buradan açıp kapat.</p><button onClick={() => { setFieldOpen(!fieldOpen); setNotice(`Saha ${fieldOpen ? "kapatıldı" : "açıldı"}.`); }} className="mt-6 flex items-center gap-2 rounded-full bg-[var(--lime)] px-5 py-3 text-sm font-bold text-[var(--green)]"><Settings size={16} /> Sahayı {fieldOpen ? "kapat" : "aç"}</button></div><div className="rounded-2xl bg-white p-6"><h2 className="display text-2xl font-extrabold">İşletme bilgileri</h2><div className="mt-5 space-y-3 text-sm text-[var(--muted)]"><p>0545 223 78 78</p><p>0414 247 51 51</p><p>Gündüz: 1200 TL</p><p>Gece: 1800 TL</p><p>Abone indirimi: %10</p></div></div></section></div></main>;
}