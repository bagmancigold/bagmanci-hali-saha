"use client";

import { ArrowLeft, CalendarDays, CreditCard, Image, MessageCircle, Plus, Save, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabase";
import { defaultImageFits, defaultSiteImages, type ImageFit, type SiteImages } from "../../../lib/siteSettings";

type ImageKey = keyof SiteImages;
type ImageField = { key: ImageKey; title: string; description: string; alt: string };

const imageFields: ImageField[] = [
  { key: "hero", title: "Hero / Karşılama Arka Planı", description: "Maçın adresi belli alanının görseli (hero bölümünün tamamının arka planıdır).", alt: "Hero görseli önizleme" },
  { key: "background", title: "Rezervasyon Kartı Arka Planı", description: "Yalnızca rezervasyon formunun arkasındaki doku. Hero ile karışmaz.", alt: "Rezervasyon kartı önizleme" },
  { key: "match", title: "Maç Tekrarı & Video Banner", description: "Maç arşivi ve video alanının görseli.", alt: "Maç tekrarları görseli önizleme" },
  { key: "logo", title: "Site Logosu", description: "Header'da marka ikonunun yerine çıkar. Boş bırakılırsa varsayılan ikon kullanılır.", alt: "Site logosu önizleme" },
  { key: "favicon", title: "Site Favicon / Mini Logo", description: "Tarayıcı sekmesindeki mini logo.", alt: "Favicon önizleme" },
];

const fitOptions: { value: ImageFit; label: string }[] = [
  { value: "cover", label: "Kırp (alanı doldur)" },
  { value: "contain", label: "Tam sığdır (kırpma yok)" },
];

const NEW_COLUMNS = ["favicon_image", "logo_image", "hero_fit", "background_fit", "match_fit", "logo_fit", "favicon_fit"];

const defaultPrices = { day: "1200", night: "1800", subscriber: "1700" };
type ReadyReply = { id: string; keyword: string; response_text: string; active: boolean; priority: number };

export default function SiteSettingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "pricing" | "whatsapp">("images");
  const [message, setMessage] = useState("Kontrol ediliyor...");
  const [saving, setSaving] = useState<string | null>(null);
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [fits, setFits] = useState<Record<ImageKey, ImageFit>>(defaultImageFits);
  const [prices, setPrices] = useState(defaultPrices);
  const [readyReplies, setReadyReplies] = useState<ReadyReply[]>([]);

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
        let { data, error } = await client
          .from("site_settings")
          .select("hero_image, match_image, background_image, favicon_image, logo_image, hero_fit, background_fit, match_fit, logo_fit, day_price, night_price, subscriber_price")
          .eq("id", "main")
          .maybeSingle<{
            hero_image: string;
            match_image: string;
            background_image: string;
            favicon_image: string;
            logo_image: string;
            hero_fit: ImageFit;
            background_fit: ImageFit;
            match_fit: ImageFit;
            logo_fit: ImageFit;
            day_price: number;
            night_price: number;
            subscriber_price: number;
          }>();
        if (error) {
          // newer columns (logo/fit/favicon) may not exist yet on this database; retry with the originals only.
          const retry = await client
            .from("site_settings")
            .select("hero_image, match_image, background_image, day_price, night_price, subscriber_price")
            .eq("id", "main")
            .maybeSingle<{
              hero_image: string;
              match_image: string;
              background_image: string;
              day_price: number;
              night_price: number;
              subscriber_price: number;
            }>();
          data = retry.data as typeof data;
          error = retry.error;
        }
        if (error) throw error;
        if (data) {
          setImages({
            hero: data.hero_image || defaultSiteImages.hero,
            match: data.match_image || defaultSiteImages.match,
            background: data.background_image || defaultSiteImages.background,
            favicon: data.favicon_image || defaultSiteImages.favicon,
            logo: data.logo_image || defaultSiteImages.logo,
          });
          setFits({
            hero: data.hero_fit || defaultImageFits.hero,
            match: data.match_fit || defaultImageFits.match,
            background: data.background_fit || defaultImageFits.background,
            favicon: defaultImageFits.favicon,
            logo: data.logo_fit || defaultImageFits.logo,
          });
          setPrices({ day: String(data.day_price || defaultPrices.day), night: String(data.night_price || defaultPrices.night), subscriber: String(data.subscriber_price || defaultPrices.subscriber) });
        }
        const { data: replies } = await client
          .from("whatsapp_ready_replies")
          .select("id, keyword, response_text, active, priority")
          .order("priority", { ascending: true });
        setReadyReplies(replies || []);
        setMessage("");
      } catch {
        setImages(defaultSiteImages);
        setFits(defaultImageFits);
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
    const payload: Record<string, string> = {
      id: "main",
      hero_image: images.hero,
      match_image: images.match,
      background_image: images.background,
      favicon_image: images.favicon,
      logo_image: images.logo,
      hero_fit: fits.hero,
      background_fit: fits.background,
      match_fit: fits.match,
      logo_fit: fits.logo,
      updated_at: new Date().toISOString(),
    };
    const client = getSupabaseClient();
    let error: { message: string } | null = null;
    // Try the full payload first; silently drop any column the database doesn't have yet
    // (rather than failing the whole save) until it succeeds.
    for (let attempt = 0; attempt < NEW_COLUMNS.length + 1; attempt += 1) {
      const result = await client.from("site_settings").upsert(payload);
      error = result.error;
      if (!error) break;
      const missingColumn = NEW_COLUMNS.find((column) => column in payload && error!.message.includes(column));
      if (!missingColumn) break;
      delete payload[missingColumn];
    }
    setSaving(null);
    if (error) {
      setMessage(`Görseller kaydedilemedi. Supabase SQL politikasını güncelle: ${error.message}`);
      return;
    }
    setImages((current) => ({ ...current }));
    setFits((current) => ({ ...current }));
    setMessage("Tüm ayarlar başarıyla kaydedildi!");
  };

  const savePrices = async () => {
    setSaving("pricing");
    const { error } = await getSupabaseClient().from("site_settings").upsert({ id: "main", day_price: Number(prices.day) || 1200, night_price: Number(prices.night) || 1800, subscriber_price: Number(prices.subscriber) || 1700, updated_at: new Date().toISOString() });
    setSaving(null);
    setMessage(error ? `Tarifeler kaydedilemedi. Supabase SQL politikasını güncelle: ${error.message}` : "Tarife ayarları kaydedildi.");
  };

  const addReadyReply = async () => {
    setSaving("whatsapp");
    const { data, error } = await getSupabaseClient()
      .from("whatsapp_ready_replies")
      .insert({ keyword: "yeni", response_text: "Yeni hazır cevap metni", active: true, priority: readyReplies.length * 10 + 100 })
      .select("id, keyword, response_text, active, priority")
      .single();
    setSaving(null);
    if (error) { setMessage(`Hazır cevap eklenemedi: ${error.message}`); return; }
    setReadyReplies((current) => [...current, data]);
    setMessage("Hazır cevap eklendi.");
  };

  const saveReadyReply = async (reply: ReadyReply) => {
    setSaving(reply.id);
    const { error } = await getSupabaseClient()
      .from("whatsapp_ready_replies")
      .update({ keyword: reply.keyword, response_text: reply.response_text, active: reply.active, priority: reply.priority })
      .eq("id", reply.id);
    setSaving(null);
    setMessage(error ? `Hazır cevap kaydedilemedi: ${error.message}` : "Hazır cevap kaydedildi.");
  };

  const deleteReadyReply = async (id: string) => {
    const { error } = await getSupabaseClient().from("whatsapp_ready_replies").delete().eq("id", id);
    if (error) { setMessage(`Hazır cevap silinemedi: ${error.message}`); return; }
    setReadyReplies((current) => current.filter((reply) => reply.id !== id));
    setMessage("Hazır cevap silindi.");
  };

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[var(--green)] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><ShieldCheck className="mx-auto mb-5 text-[var(--green)]" size={36} /><h1 className="display text-2xl font-extrabold">Yetkili admin girişi gerekli</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Site ayarlarını görmek için admin hesabıyla giriş yapıp 2FA kodunu doğrula.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white">Admin girişine git</a><p className="mt-4 text-xs text-[var(--muted)]">{message}</p></div></main>;

  return <main className="admin-settings-page min-h-screen px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-5xl"><a href="/admin" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Yönetim</p><h1 className="display text-4xl font-extrabold">Site ayarları</h1><p className="mt-2 text-sm text-[var(--muted)]">Görselleri, tarifeleri ve WhatsApp cevaplarını tek ekrandan yönet.</p></div><div className="admin-settings-tabs" role="tablist"><button type="button" role="tab" aria-selected={activeTab === "images"} className={activeTab === "images" ? "admin-settings-tab active" : "admin-settings-tab"} onClick={() => setActiveTab("images")}><Image size={17} /> Görsel Yönetimi</button><button type="button" role="tab" aria-selected={activeTab === "pricing"} className={activeTab === "pricing" ? "admin-settings-tab active" : "admin-settings-tab"} onClick={() => setActiveTab("pricing")}><CreditCard size={17} /> Tarife Ayarları</button><button type="button" role="tab" aria-selected={activeTab === "whatsapp"} className={activeTab === "whatsapp" ? "admin-settings-tab active" : "admin-settings-tab"} onClick={() => setActiveTab("whatsapp")}><MessageCircle size={17} /> WhatsApp</button></div>{activeTab === "images" ? <section className="admin-settings-panel"><div className="admin-settings-grid">{imageFields.map((field) => <article className="admin-image-card" key={field.key}><div className="admin-image-preview"><img src={images[field.key]} alt={field.alt} style={{ objectFit: fits[field.key] }} /><span>{field.title}</span></div><h2>{field.title}</h2><p>{field.description}</p><div className="admin-image-actions"><label className="admin-upload-button"><Upload size={15} /> Görsel yükle<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(field.key, file); }} /></label><input value={images[field.key]} onChange={(event) => setImages((current) => ({ ...current, [field.key]: event.target.value }))} placeholder="Görsel URL'si" /></div><label className="admin-fit-select">Mobilde görünüm<select value={fits[field.key]} onChange={(event) => setFits((current) => ({ ...current, [field.key]: event.target.value as ImageFit }))}>{fitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></article>)}</div><button type="button" className="admin-gold-save" onClick={saveImages} disabled={saving !== null}><Save size={16} /> {saving === "images" ? "Kaydediliyor..." : "Görselleri kaydet"}</button></section> : activeTab === "pricing" ? <section className="admin-pricing-panel"><div className="admin-pricing-heading"><CalendarDays size={22} /><div><h2>Tarife Ayarları</h2><p>Gündüz, gece ve abone fiyatlarını güncelle.</p></div></div><div className="admin-pricing-grid"><label>Gündüz Tarifesi (TL)<input type="number" min="0" value={prices.day} onChange={(event) => setPrices((current) => ({ ...current, day: event.target.value }))} /></label><label>Gece Tarifesi (TL)<input type="number" min="0" value={prices.night} onChange={(event) => setPrices((current) => ({ ...current, night: event.target.value }))} /></label><label>Abone İndirimli Fiyatı (TL)<input type="number" min="0" value={prices.subscriber} onChange={(event) => setPrices((current) => ({ ...current, subscriber: event.target.value }))} /></label></div><button type="button" className="admin-gold-save" onClick={savePrices} disabled={saving !== null}><Save size={16} /> {saving === "pricing" ? "Kaydediliyor..." : "Tarifeleri kaydet"}</button></section> : <section className="admin-pricing-panel"><div className="admin-pricing-heading"><MessageCircle size={22} /><div><h2>Hazır cevap motoru</h2><p>Müşteri WhatsApp'tan yazınca anahtar kelimeye göre otomatik cevap verilir.</p></div></div><div className="whatsapp-reply-list">{readyReplies.map((reply) => <article className="whatsapp-reply-card" key={reply.id}><div className="admin-pricing-grid"><label>Anahtar kelime<input value={reply.keyword} onChange={(event) => setReadyReplies((current) => current.map((item) => item.id === reply.id ? { ...item, keyword: event.target.value } : item))} /></label><label>Sıra<input type="number" value={reply.priority} onChange={(event) => setReadyReplies((current) => current.map((item) => item.id === reply.id ? { ...item, priority: Number(event.target.value) || 0 } : item))} /></label><label>Aktif<select value={reply.active ? "true" : "false"} onChange={(event) => setReadyReplies((current) => current.map((item) => item.id === reply.id ? { ...item, active: event.target.value === "true" } : item))}><option value="true">Aktif</option><option value="false">Pasif</option></select></label></div><label className="whatsapp-reply-text">Cevap metni<textarea value={reply.response_text} onChange={(event) => setReadyReplies((current) => current.map((item) => item.id === reply.id ? { ...item, response_text: event.target.value } : item))} /></label><div className="whatsapp-reply-actions"><button type="button" className="admin-gold-save" onClick={() => saveReadyReply(reply)} disabled={saving !== null}><Save size={16} /> Kaydet</button><button type="button" className="whatsapp-delete-button" onClick={() => deleteReadyReply(reply.id)}><Trash2 size={16} /> Sil</button></div></article>)}</div><button type="button" className="admin-gold-save" onClick={addReadyReply} disabled={saving !== null}><Plus size={16} /> Yeni hazır cevap</button></section>}{message && <p className={`admin-settings-message${/kaydedilemedi|eklenemedi|silinemedi/i.test(message) ? " error" : /kaydedildi|eklendi|silindi/i.test(message) ? " success" : ""}`}>{message}</p>}</div></main>;
}
