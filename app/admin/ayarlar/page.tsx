"use client";

import { ArrowLeft, Image, Save, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabase";
import { defaultSiteImages, type SiteImages } from "../../../lib/siteSettings";

export default function SiteSettingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [dayPrice, setDayPrice] = useState("1200");
  const [nightPrice, setNightPrice] = useState("1800");

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSupabaseClient();
        const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance?.currentLevel !== "aal2") {
          setMessage("Bu sayfa için admin girişi ve 2FA gerekir.");
          return;
        }
        setAuthorized(true);
        const { data, error } = await client.from("site_settings").select("hero_image, match_image, background_image, day_price, night_price").eq("id", "main").maybeSingle();
        if (error) throw error;
        if (data) {
          setImages({ hero: data.hero_image || defaultSiteImages.hero, match: data.match_image || defaultSiteImages.match, background: data.background_image || defaultSiteImages.background });
          setDayPrice(String(data.day_price || 1200));
          setNightPrice(String(data.night_price || 1800));
        }
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Ayarlar yüklenemedi.");
      }
    };
    load();
  }, []);

  const uploadImage = async (file: File) => {
    setMessage("Rezervasyon kartı görseli yükleniyor...");
    try {
      const client = getSupabaseClient();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `booking-${Date.now()}.${extension}`;
      const { error } = await client.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = client.storage.from("site-assets").getPublicUrl(path);
      setImages((current) => ({ ...current, background: data.publicUrl }));
      setMessage("Görsel seçildi. Kaydet butonuna basarak yayınla.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    const { error } = await getSupabaseClient().from("site_settings").upsert({
      id: "main",
      hero_image: images.hero,
      match_image: images.match,
      background_image: images.background,
      day_price: Number(dayPrice),
      night_price: Number(nightPrice),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMessage(error ? error.message : "Site ayarları kaydedildi.");
  };

  if (!authorized) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Site ayarlarını görmek için admin hesabıyla giriş yapıp 2FA kodunu doğrula.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;
  }

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-4xl"><a href="/admin" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Yönetim</p><h1 className="display text-4xl font-extrabold">Site ayarları</h1><p className="mt-2 text-sm text-[var(--muted)]">Rezervasyon kartı görselini ve tarifeleri buradan güncelle.</p></div><section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><Image className="text-[var(--green)]" /><div><h2 className="display text-2xl font-extrabold">Ana sayfa rezervasyon kartı görseli</h2><p className="mt-1 text-sm text-[var(--muted)]">Kartın arka planındaki görseli yükle veya URL ile değiştir.</p></div></div><label className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--green)] bg-[#f5f7f3] px-4 py-4 text-sm font-bold text-[var(--green)]"><Upload size={17} /> Görsel yükle<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file); }} /></label><img src={images.background} alt="Rezervasyon kartı önizleme" className="mt-4 h-52 w-full rounded-2xl object-cover" /><input value={images.background} onChange={(event) => setImages({ ...images, background: event.target.value })} className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--green)]" placeholder="Görsel URL'si" /></section><section className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><Save className="text-[var(--green)]" /><div><h2 className="display text-2xl font-extrabold">Tarife fiyatları</h2><p className="mt-1 text-sm text-[var(--muted)]">Gündüz ve gece ücretlerini hızlıca değiştir.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Gündüz tarifesi (TL)<input type="number" min="0" value={dayPrice} onChange={(event) => setDayPrice(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label><label className="text-sm font-bold">Gece tarifesi (TL)<input type="number" min="0" value={nightPrice} onChange={(event) => setNightPrice(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--green)]" /></label></div><button type="button" onClick={save} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-6 py-3 text-sm font-extrabold text-white"><Save size={16} /> {saving ? "Kaydediliyor..." : "Ayarları kaydet"}</button>{message && <p className="mt-3 text-sm font-semibold text-[var(--green)]">{message}</p>}</section></div></main>;
}
