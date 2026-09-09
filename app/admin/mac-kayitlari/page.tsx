"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase";

type Match = { id: string; title: string; match_date: string; field_name: string; duration: string; video_url: string; thumbnail_url: string };

export default function AdminMatchRecordsPage() {
  const [items, setItems] = useState<Match[]>([]);
  const [msg, setMsg] = useState("Yükleniyor...");
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ title: "", match_date: new Date().toISOString().split("T")[0], field_name: "Saha 1", duration: "60:00", video_url: "", thumbnail_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const client = getSupabaseClient();
        const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (data?.currentLevel !== "aal2") { setMsg("Admin girişi ve 2FA gerekli."); return; }
        setAuth(true);
        const { data: res, error } = await client.from("match_records").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setItems(res || []);
        setMsg(res?.length ? "" : "Henüz maç kaydı yok.");
      } catch (e) { setMsg(e instanceof Error ? e.message : "Yüklenemedi."); }
    })();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.video_url) return;
    setSaving(true);
    try {
      const { data, error } = await getSupabaseClient().from("match_records").insert({
        title: form.title, match_date: form.match_date, field_name: form.field_name,
        duration: form.duration || "60:00", video_url: form.video_url,
        thumbnail_url: form.thumbnail_url || "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=85"
      }).select().single();
      if (error) throw error;
      setItems([data, ...items]);
      setForm({ title: "", match_date: new Date().toISOString().split("T")[0], field_name: "Saha 1", duration: "60:00", video_url: "", thumbnail_url: "" });
      setMsg("Eklendi.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Hata."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    const { error } = await getSupabaseClient().from("match_records").delete().eq("id", id);
    if (!error) setItems(items.filter((i) => i.id !== id));
  };

  if (!auth) return <main className="p-10"><a href="/admin" className="text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Girişe dön</a><p className="mt-4">{msg}</p></main>;

  return (
    <main className="min-h-screen bg-[#f5f7f3] p-6 lg:p-10 text-[var(--ink)]">
      <div className="mx-auto max-w-4xl">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green)]"><ArrowLeft size={16} /> Admin paneline dön</a>
        <h1 className="display text-3xl font-extrabold mt-4">Maç Kayıtları</h1>
        {msg && <p className="mt-3 text-sm text-[var(--green)]">{msg}</p>}

        <form onSubmit={add} className="mt-6 rounded-2xl bg-white p-6 shadow-sm grid gap-3 sm:grid-cols-2">
          <input className="border p-2.5 rounded-xl text-sm" placeholder="Maç Başlığı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="border p-2.5 rounded-xl text-sm" type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} required />
          <select className="border p-2.5 rounded-xl text-sm" value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })}><option>Saha 1</option><option>Saha 2</option></select>
          <input className="border p-2.5 rounded-xl text-sm" placeholder="Süre (60:00)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <input className="border p-2.5 rounded-xl text-sm sm:col-span-2" placeholder="Video URL" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} required />
          <input className="border p-2.5 rounded-xl text-sm sm:col-span-2" placeholder="Kapak Görsel URL" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
          <button disabled={saving} className="rounded-full bg-[var(--green)] py-2.5 text-sm font-bold text-white sm:col-span-2">{saving ? "Ekleniyor..." : "Maç Kaydı Ekle"}</button>
        </form>

        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div><p className="font-bold text-sm">{it.title}</p><p className="text-xs text-[var(--muted)]">{it.match_date} · {it.field_name} · {it.duration}</p></div>
              <button onClick={() => remove(it.id)} className="text-red-600 p-2"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
