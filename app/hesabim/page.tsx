"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

const subscriptionHours = ["21:00 - 22:00", "22:00 - 23:00", "23:00 - 00:00", "00:00 - 01:00", "01:00 - 02:00"];
type AccountProfile = { phone: string; subscriber: boolean; subscription_package: string; preferred_subscription_time: string };
type UserBooking = { id: string; booking_date: string; booking_time: string; package_name: string; total_amount: number; payment_status: string };

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [profile, setProfile] = useState<AccountProfile>({ phone: "", subscriber: false, subscription_package: "", preferred_subscription_time: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<UserBooking[]>([]);

  useEffect(() => {
    const load = async () => {
      const client = getSupabaseClient();
      const { data } = await client.auth.getUser();
      if (!data.user) {
        window.location.href = "/musteri";
        return;
      }
      setEmail(data.user.email || "");
      setFullName(data.user.user_metadata?.full_name || "Abdullah BAĞMANCI");
      const { data: saved, error } = await client.from("profiles").select("phone, subscriber, subscription_package, preferred_subscription_time").eq("id", data.user.id).maybeSingle();
      if (!error && saved) setProfile({ phone: saved.phone || "", subscriber: Boolean(saved.subscriber), subscription_package: saved.subscription_package || "", preferred_subscription_time: saved.preferred_subscription_time || "" });
      const { data: userBookings } = await client.from("booking_requests").select("id, booking_date, booking_time, package_name, total_amount, payment_status").eq("user_id", data.user.id).order("booking_date", { ascending: false }).order("booking_time", { ascending: false });
      setBookings(userBookings || []);
      setLoading(false);
    };
    load().catch(() => { setMessage("Hesap bilgileri yüklenemedi."); setLoading(false); });
  }, []);

  const updateField = (field: keyof AccountProfile, value: string | boolean) => setProfile((current) => ({ ...current, [field]: value }));
  const save = async () => {
    setSaving(true);
    setMessage("");
    const { data } = await getSupabaseClient().auth.getUser();
    if (!data.user) return;
    const { error } = await getSupabaseClient().from("profiles").upsert({ id: data.user.id, full_name: fullName, phone: profile.phone.trim(), subscriber: profile.subscriber, subscription_package: profile.subscription_package, preferred_subscription_time: profile.preferred_subscription_time });
    setSaving(false);
    setMessage(error ? error.message : "Başarıyla güncellendi");
  };
  const signOut = async () => { await getSupabaseClient().auth.signOut(); window.location.href = "/"; };

  if (loading) return <main className="account-page flex min-h-screen items-center justify-center"><p>Hesap yükleniyor...</p></main>;
  return <main className="account-page min-h-screen px-5 py-28 text-[var(--ink)] sm:px-8"><div className="mx-auto max-w-5xl"><a href="/" className="account-back"><ArrowLeft size={16} /> Siteye dön</a><div className="account-heading"><div><p className="account-eyebrow">HESAP MERKEZİ</p><h1>Merhaba, {fullName || "Abdullah BAĞMANCI"}</h1><p>Profilini, iletişim bilgilerini ve saha aboneliğini buradan yönet.</p></div><button type="button" onClick={signOut} className="account-signout"><LogOut size={16} /> Çıkış Yap</button></div><div className="account-layout"><section className="account-card"><div className="account-card-heading"><span className="account-icon"><UserRound size={20} /></span><div><h2>Google bilgileri</h2><p>Güvenli hesap bilgilerin</p></div></div><label>E-posta<input value={email} disabled /><small><ShieldCheck size={13} /> Google ile doğrulandı, değiştirilemez</small></label><label>Ad Soyad<input value={fullName} disabled /><small>Google hesabından otomatik alınır.</small></label></section><section className="account-card"><div className="account-card-heading"><span className="account-icon"><Clock3 size={20} /></span><div><h2>İletişim ve üyelik</h2><p>Rezervasyon tercihlerini güncel tut</p></div></div><label>Cep Telefonu<input value={profile.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="05xx xxx xx xx" /></label><div className={`account-membership ${profile.subscriber ? "active" : ""}`}><div><span>Abonelik durumu</span><strong>{profile.subscriber ? profile.subscription_package || "Haftalık Sabit Saha Aboneliği" : "Standart üyelik"}</strong></div><Check size={20} /></div><label>Tercih Edilen Abonelik Saati<select value={profile.preferred_subscription_time} onChange={(event) => updateField("preferred_subscription_time", event.target.value)}><option value="">Saat seçin</option>{subscriptionHours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label><button type="button" onClick={save} disabled={saving} className="account-save"><Save size={17} /> {saving ? "Kaydediliyor..." : "Bilgileri Güncelle"}</button>{message && <p className={`account-message ${message === "Başarıyla güncellendi" ? "success" : ""}`}>{message}</p>}</section></div><section id="rezervasyonlar" className="account-card account-bookings"><div className="account-card-heading"><span className="account-icon"><Clock3 size={20} /></span><div><h2>Rezervasyonlarım</h2><p>Hesabına bağlı son rezervasyonların</p></div></div>{bookings.length ? <div className="account-booking-list">{bookings.map((booking) => <div className="account-booking-row" key={booking.id}><div><strong>{new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(new Date(`${booking.booking_date}T12:00:00`))}</strong><span>{booking.booking_time}</span></div><div><b>{booking.package_name}</b><small>{booking.payment_status}</small></div><strong>₺{Number(booking.total_amount).toLocaleString("tr-TR")}</strong></div>)}</div> : <p className="account-empty">Henüz hesabına bağlı bir rezervasyon bulunmuyor.</p>}</section><div id="abonelik" className="account-links"><a href="#rezervasyonlar">Rezervasyonlarım</a><a href="#abonelik">Aboneliklerim</a></div></div></main>;
}
