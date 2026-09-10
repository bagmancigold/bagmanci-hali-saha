"use client";

import { ArrowLeft, CalendarDays, CreditCard, Image, Save, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabase";
import { defaultSiteImages, type SiteImages } from "../../../lib/siteSettings";

type ImageKey = keyof SiteImages;
type ImageField = { key: ImageKey; title: string; description: string; alt: string };

const imageFields: ImageField[] = [
  { key: "hero", title: "Hero / Karşılama Arka Planı", description: "Maçın adresi belli alanının görseli.", alt: "Hero görseli önizleme" },
  { key: "background", title: "Rezervasyon Kartı Arka Planı", description: "Rezervasyon formunun arkasındaki doku.", alt: "Rezervasyon kartı önizleme" },
  { key: "match", title: "Maç Tekrarı & Video Banner", description: "Maç arşivi ve video alanının görseli.", alt: "Maç tekrarları görseli önizleme" },
  { key: "favicon", title: "Site Favicon / Mini Logo", description: "Tarayıcı sekmesindeki mini logo.", alt: "Favicon önizleme" },
];

const defaultPrices = { day: "1200", night: "1800", subscriber: "1700" };

export default function SiteSettingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "pricing">("images");
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [saving, setSaving] = useState<string | null>(null);
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [prices, setPrices] = useState(defaultPrices);

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
        const { data, error } = await client.from("site_settings").select("hero_image, match_image, background_image, favicon_image, day_price, night_price, subscriber_price").eq("id", "main").maybeSingle();
        if (error) throw error;
        if (data) {
          setImages({ hero: data.hero_image || defaultSiteImages.hero, match: data.match_image || defaultSiteImages.match, background: data.background_image || defaultSiteImages.background, favicon: data.favicon_image || defaultSiteImages.favicon });
          setPrices({ day: String(data.day_price || defaultPrices.day), night: String(data.night_price || defaultPrices.night), subscriber: String(data.subscriber_price || defaultPrices.subscriber) });
        }
        setMessage("");
      } catch {
        setImages(defaultSiteImages);
        setPrices(defaultPrices);
        setMessage("Varsayılan ayarlar kullanılıyor. Supabase kaydı bulunamadıysa kaydet ile oluşturabilirsin.");
      }
    };
    load();
  }, []);

  const uploadImage = async (key: ImageKey, file: File) => {
    setSaving(key);
    setMessage("Görsel yükleniyor...");
    try {
      const client = getSupabaseClient();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${key}-${Date.now()}.${extension}`;
      const { error } = await client.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = client.storage.from("site-assets").getPublicUrl(path);
      setImages((current) => ({ ...current, [key]: data.publicUrl }));
      setMessage("Görsel seçildi. Kaydet butonuna basarak yayınla.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setSaving(null);
    }
  };

  const saveImages = async () => {
    setSaving("images");
    const { error } = await getSupabaseClient().from("site_settings").upsert({ id: "main", hero_image: images.hero, match_image: images.match, background_image: images.background, favicon_image: images.favicon, updated_at: new Date().toISOString() });
    setSaving(null);
    setMessage(error ? `Görseller kaydedilemedi: ${error.message}` : "Görsel ayarları kaydedildi.");
  };

  const savePrices = async () => {
    setSaving("pricing");
    const { error } = await getSupabaseClient().from("site_settings").upsert({ id: "main", day_price: Number(prices.day) || 1200, night_price: Number(prices.night) || 1800, subscriber_price: Number(prices.subscriber) || 1700, updated_at: new Date().toISOString() });
    setSaving(null);
    setMessage(error ? `Tarifeler kaydedilemedi: ${error.message}` : "Tarife ayarları kaydedildi.");
  };

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Site ayarlarını görmek için admin hesabıyla giriş yapıp 2FA kodunu doğrula.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="admin-settings-page min-h-screen px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-5xl"><a href="/admin" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Yönetim</p><h1 className="display text-4xl font-extrabold">Site ayarları</h1><p className="mt-2 text-sm text-[var(--muted)]">Görselleri ve tarifeleri tek ekrandan yönet.</p></div><div className="admin-settings-tabs" role="tablist"><button type="button" role="tab" aria-selected={activeTab === "images"} className={activeTab === "images" ? "admin-settings-tab active" : "admin-settings-tab"} onClick={() => setActiveTab("images")}><Image size={17} /> Görsel Yönetimi</button><button type="button" role="tab" aria-selected={activeTab === "pricing"} className={activeTab === "pricing" ? "admin-settings-tab active" : "admin-settings-tab"} onClick={() => setActiveTab("pricing")}><CreditCard size={17} /> Tarife Ayarları</button></div>{activeTab === "images" ? <section className="admin-settings-panel"><div className="admin-settings-grid">{imageFields.map((field) => <article className="admin-image-card" key={field.key}><div className="admin-image-preview"><img src={images[field.key]} alt={field.alt} /><span>{field.title}</span></div><h2>{field.title}</h2><p>{field.description}</p><div className="admin-image-actions"><label className="admin-upload-button"><Upload size={15} /> Görsel yükle<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(field.key, file); }} /></label><input value={images[field.key]} onChange={(event) => setImages((current) => ({ ...current, [field.key]: event.target.value }))} placeholder="Görsel URL'si" /></div></article>)}</div><button type="button" className="admin-gold-save" onClick={saveImages} disabled={saving !== null}><Save size={16} /> {saving === "images" ? "Kaydediliyor..." : "Görselleri kaydet"}</button></section> : <section className="admin-pricing-panel"><div className="admin-pricing-heading"><CalendarDays size={22} /><div><h2>Tarife Ayarları</h2><p>Gündüz, gece ve abone fiyatlarını güncelle.</p></div></div><div className="admin-pricing-grid"><label>Gündüz Tarifesi (TL)<input type="number" min="0" value={prices.day} onChange={(event) => setPrices((current) => ({ ...current, day: event.target.value }))} /></label><label>Gece Tarifesi (TL)<input type="number" min="0" value={prices.night} onChange={(event) => setPrices((current) => ({ ...current, night: event.target.value }))} /></label><label>Abone İndirimli Fiyatı (TL)<input type="number" min="0" value={prices.subscriber} onChange={(event) => setPrices((current) => ({ ...current, subscriber: event.target.value }))} /></label></div><button type="button" className="admin-gold-save" onClick={savePrices} disabled={saving !== null}><Save size={16} /> {saving === "pricing" ? "Kaydediliyor..." : "Tarifeleri kaydet"}</button></section>}{message && <p className="admin-settings-message">{message}</p>}</div></main>;
}
