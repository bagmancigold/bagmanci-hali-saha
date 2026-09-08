"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Play, Search, ShieldCheck, Video } from "lucide-react";

const matches = [
  { id: "mac-1", title: "Bağmancı FC - Şanlıurfa United", date: "12 Haziran 2024", field: "Saha 1", duration: "58:12", image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=85", video: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" },
  { id: "mac-2", title: "Kaptanlar Ligi · Hafta 4", date: "08 Haziran 2024", field: "Saha 2", duration: "61:40", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=85", video: "https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4" },
  { id: "mac-3", title: "Cuma Gece Maçı", date: "31 Mayıs 2024", field: "Saha 1", duration: "54:28", image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=85", video: "https://storage.googleapis.com/coverr-main/mp4/Playing with the ball.mp4" }
];

export default function MatchArchive() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("Tüm sahalar");
  const [active, setActive] = useState(matches[0]);
  const filtered = useMemo(() => matches.filter((match) => `${match.title} ${match.date}`.toLowerCase().includes(query.toLowerCase()) && (field === "Tüm sahalar" || match.field === field)), [field, query]);

  return <section id="kayitlar" className="match-archive bg-[#eef1eb] px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[1240px]">
    <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-[var(--green)]">Maç kayıtları</p><h2 className="display max-w-2xl text-4xl font-extrabold leading-none sm:text-6xl">Maçın heyecanı, <span className="text-[var(--green)]">tekrar sende.</span></h2></div><p className="max-w-md text-base leading-7 text-[var(--muted)]">Maçın bittikten sonra kaydını bul, en güzel pozisyonları tekrar izle. Üyeler için arşiv erişimi ücretsiz.</p></div>
    <div className="mb-10 grid gap-4 sm:grid-cols-3"><article className="match-step"><span>01</span><Video size={21} /><h3>Kameralar kaydeder</h3><p>Maçın boyunca saha görüntüsü güvenli biçimde kayda alınır.</p></article><article className="match-step"><span>02</span><ShieldCheck size={21} /><h3>Kayıt arşive düşer</h3><p>Maç tamamlanınca tarih ve saha bilgisiyle arşivlenir.</p></article><article className="match-step"><span>03</span><Play size={21} /><h3>Tekrarını izle</h3><p>Hesabından kaydı aç, pozisyonları ve maçın tamamını izle.</p></article></div>
    <div className="mb-8 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Maç veya tarih ara" className="match-filter-input pl-11" /></label><select value={field} onChange={(event) => setField(event.target.value)} className="match-filter-input sm:max-w-[180px]"><option>Tüm sahalar</option><option>Saha 1</option><option>Saha 2</option></select></div>
    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="overflow-hidden rounded-[28px] bg-[#17382a] shadow-xl"><div className="relative aspect-video bg-black">{active.video ? <video key={active.video} controls poster={active.image} className="h-full w-full object-cover" src={active.video}>Tarayıcın video oynatmayı desteklemiyor.</video> : <img src={active.image} alt={active.title} className="h-full w-full object-cover" />}<div className="pointer-events-none absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">{active.field} · {active.duration}</div></div><div className="p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lime)]">Şimdi izliyorsun</p><h3 className="display mt-2 text-2xl font-extrabold">{active.title}</h3><p className="mt-2 flex items-center gap-2 text-sm text-white/60"><CalendarDays size={15} /> {active.date}</p></div></div><div className="space-y-3">{filtered.length ? filtered.map((match) => <button type="button" key={match.id} onClick={() => setActive(match)} className={`match-card ${active.id === match.id ? "match-card-active" : ""}`}><img src={match.image} alt="" /><span><strong>{match.title}</strong><small>{match.date} · {match.field}</small></span><ChevronRight size={18} /></button>) : <p className="rounded-2xl bg-white p-6 text-sm font-semibold text-[var(--muted)]">Bu aramaya uygun kayıt bulunamadı.</p>}</div></div>
  </div></section>;
}
