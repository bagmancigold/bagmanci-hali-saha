"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Image, Save, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";
import { defaultSiteImages, type SiteImages } from "../../../lib/siteSettings";

export default function SiteSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [message, setMessage] = useState("Yükleniyor...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSupabaseClient().from("site_settings").select("hero_image, match_image").eq("id", "main").maybeSingle().then(({ data }) => {
      if (data) setImages({ hero: data.hero_image || defaultSiteImages.hero, match: data.match_image || defaultSiteImages.match });
      setMessage("");
    }).catch(() => setMessage("Ayar tablosu hazır değil. Supabase SQL şemasını çalıştırın."));
  }, []);

  const save = async () => {
    setSaving(true); setMessage("");
    const { error } = await getSupabaseClient().from("site_settings").upsert({ id: "main", hero_image: images.hero, match_image: images.match, updated_at: new Date().toISOString() });
    setMessage(error ? `Kayıt başarısız: ${error.message}` : "Görseller kaydedildi. Ana sayfayı yenileyince güncellenecek.");
    setSaving(false);
  };

  return <main className="min-h-screen bg-[#f5f7f3] px-5 py-10 text-[var(--ink)] lg:px-10"><div className="mx-auto max-w-4xl"><a href="/admin" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Yönetim</p><h1 className="display text-4xl font-extrabold">Site ayarları</h1><p className="mt-2 text-sm text-[var(--muted)]">Ana sayfadaki görselleri URL girerek değiştir.</p></div><section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="mb-8 flex items-center gap-3"><Image className="text-[var(--green)]" /><h2 className="display text-2xl font-extrabold">Görsel yönetimi</h2></div><label className="block text-sm font-bold">Ana giriş görseli<input value={images.hero} onChange={(event) => setImages({ ...images, hero: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--green)]" placeholder="https://..." /></label>{images.hero && <img src={images.hero} alt="Ana giriş önizleme" className="mt-4 h-48 w-full rounded-2xl object-cover" />}<label className="mt-8 block text-sm font-bold">Maç kayıtları görseli<input value={images.match} onChange={(event) => setImages({ ...images, match: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--green)]" placeholder="https://..." /></label>{images.match && <img src={images.match} alt="Maç kayıtları önizleme" className="mt-4 h-48 w-full rounded-2xl object-cover" />}<button disabled={saving} onClick={save} className="mt-8 flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Save size={16} /> {saving ? "Kaydediliyor..." : "Görselleri kaydet"}</button>{message && <p className="mt-4 rounded-xl bg-[#f5f7f3] p-3 text-sm font-semibold text-[var(--green)]">{message}</p>}</section><p className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]"><ShieldCheck size={14} /> Bu alan yalnızca Supabase MFA ile doğrulanmış admin hesabı içindir.</p></div></main>;
}
