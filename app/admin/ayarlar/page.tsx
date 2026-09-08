"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Image, Save, ShieldCheck, Upload } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";
import { defaultSiteImages, type SiteImages } from "../../../lib/siteSettings";

export default function SiteSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSupabaseClient();
        const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance?.currentLevel !== "aal2") { setMessage("Bu sayfa için admin girişi ve 2FA gerekir."); return; }
        setAuthorized(true);
        const { data } = await client.from("site_settings").select("hero_image, match_image, background_image").eq("id", "main").maybeSingle();
        if (data) setImages({ hero: data.hero_image || defaultSiteImages.hero, match: data.match_image || defaultSiteImages.match, background: data.background_image || defaultSiteImages.background });
        setMessage("");
      } catch { setMessage("Ayarlar yüklenemedi. Supabase şemasını ve admin MFA girişini kontrol edin."); }
    };
    load();
  }, []);

  const uploadImage = async (key: keyof SiteImages, file: File) => {
    setMessage("Görsel yükleniyor...");
    try {
      const client = getSupabaseClient();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${key}-${Date.now()}.${extension}`;
      const { error } = await client.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = client.storage.from("site-assets").getPublicUrl(path);
      setImages((current) => ({ ...current, [key]: data.publicUrl }));
      setMessage("Görsel seçildi. Kalıcı olması için Görselleri kaydet butonuna basın.");
    } catch (error) { setMessage(error instanceof Error ? `Görsel yüklenemedi: ${error.message}` : "Görsel yüklenemedi."); }
  };

  const save = async () => {
    setSaving(true); setMessage("");
    const { error } = await getSupabaseClient().from("site_settings").upsert({ id: "main", hero_image: images.hero, background_image: images.background, match_image: images.match, updated_at: new Date().toISOString() });
    setMessage(error ? `Kayıt başarısız: ${error.message}` : "Görseller kaydedildi.");
    setSaving(false);
  };

  const field = (label: string, key: keyof SiteImages, alt: string) => <div className="mt-7"><label className="block text-sm font-bold">{label}</label><label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--green)] bg-[#f5f7f3] px-4 py-4 text-sm font-bold text-[var(--green)]"><Upload size={17} /> Galeriden görsel seç<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(key, file); }} /></label>{images[key] && <img src={images[key]} alt={alt} className="mt-4 h-44 w-full rounded-2xl object-cover" />}<input value={images[key]} onChange={(event) => setImages({ ...images, [key]: event.target.value })} className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--green)]" placeholder="İstersen görsel URL'si de girebilirsin" /></div>;

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Site ayarlarını görmek için önce admin hesabıyla giriş yapıp 2FA kodunu doğrula.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-4xl"><a href="/admin" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Yönetim</p><h1 className="display text-4xl font-extrabold">Site ayarları</h1><p className="mt-2 text-sm text-[var(--muted)]">Galeriden görsel seçerek siteyi güncelle.</p></div><section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="mb-2 flex items-center gap-3"><Image className="text-[var(--green)]" /><h2 className="display text-2xl font-extrabold">Görsel galerisi</h2></div>{field("Ana giriş görseli", "hero", "Ana giriş önizleme")}{field("Site arka plan görseli", "background", "Site arka plan önizleme")}{field("Maç kayıtları görseli", "match", "Maç kayıtları önizleme")}<button disabled={saving} onClick={save} className="mt-8 flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Save size={16} /> {saving ? "Kaydediliyor..." : "Görselleri kaydet"}</button>{message && <p className="mt-4 rounded-xl bg-[#f5f7f3] p-3 text-sm font-semibold text-[var(--green)]">{message}</p>}</section></div></main>;
}