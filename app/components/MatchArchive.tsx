"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Play, Search, ShieldCheck, Video } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

const emptyMatch = { id: "", title: "", date: "", field: "", duration: "", image: "", video: "" };

export default function MatchArchive() {
  const [matches, setMatches] = useState<typeof emptyMatch[]>([]);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("Tüm sahalar");
  const [active, setActive] = useState<typeof emptyMatch | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await getSupabaseClient().from("match_records").select("*").order("match_date", { ascending: false });
        if (!error && data && data.length > 0) {
          const formatted = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            date: d.match_date,
            field: d.field_name,
            duration: d.duration,
            image: d.thumbnail_url || "",
            video: d.video_url
          }));
          setMatches(formatted);
          setActive(formatted[0]);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    return matches.filter((match) => {
      const dateLabel = match.date
        ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${match.date}T12:00:00`))
        : "";
      const searchable = `${match.title} ${match.date} ${dateLabel} ${match.duration} ${match.field}`.toLocaleLowerCase("tr-TR");
      return searchable.includes(normalizedQuery) && (field === "Tüm sahalar" || match.field === field);
    });
  }, [field, query, matches]);

  return <section id="kayitlar" className="match-archive scroll-mt-32 bg-[#eef1eb] px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[1240px]">
    <div className="mb-8"><p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-[var(--green)]">Maç kayıtları</p><h2 className="display max-w-2xl text-4xl font-extrabold leading-none sm:text-6xl">Maçın heyecanı, <span className="text-[var(--green)]">tekrar sende.</span></h2></div>
    <div className="mb-10 overflow-hidden rounded-[28px] bg-[#17382a] shadow-xl"><div className="relative aspect-video bg-black">{active?.video ? <video key={active.video} controls poster={active.image} className="h-full w-full object-cover" src={active.video}>Tarayıcın video oynatmayı desteklemiyor.</video> : <img src={active?.image} alt={active?.title} className="h-full w-full object-cover" />}<div className="pointer-events-none absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">{active?.field} · {active?.duration}</div></div><div className="p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lime)]">Şimdi izliyorsun</p><h3 className="display mt-2 text-2xl font-extrabold">{active?.title || "Maç kaydı seç"}</h3><p className="mt-2 flex items-center gap-2 text-sm text-white/60"><CalendarDays size={15} /> {active?.date || "Arşivden bir kayıt seç"}</p></div></div>
    <div className="mb-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row"><label className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Saat, tarih veya maç ara..." className="match-filter-input box-border w-full pl-11" /></label><select value={field} onChange={(event) => setField(event.target.value)} className="match-filter-input box-border w-full sm:max-w-[180px]"><option>Tüm sahalar</option><option>Saha 1</option><option>Saha 2</option></select></div>
    <div className="space-y-3">{filtered.length ? filtered.map((match) => <button type="button" key={match.id} onClick={() => setActive(match)} className={`match-card ${active?.id === match.id ? "match-card-active" : ""}`}><img src={match.image} alt="" /><span><strong>{match.title}</strong><small>{match.date} · {match.field} · {match.duration}</small></span><ChevronRight size={18} /></button>) : <p className="match-empty-state rounded-2xl p-6 text-sm font-semibold">Bu aramaya uygun kayıt bulunamadı.</p>}</div>
    <div className="mt-12 grid gap-4 sm:grid-cols-3"><article className="match-step"><span>01</span><Video size={21} /><h3>Kameralar kaydeder</h3><p>Maçın boyunca saha görüntüsü güvenli biçimde kayda alınır.</p></article><article className="match-step"><span>02</span><ShieldCheck size={21} /><h3>Kayıt arşive düşer</h3><p>Maç tamamlanınca tarih ve saha bilgisiyle arşivlenir.</p></article><article className="match-step"><span>03</span><Play size={21} /><h3>Tekrarını izle</h3><p>Hesabından kaydı aç, pozisyonları ve maçın tamamını izle.</p></article></div>
    <p className="mt-8 max-w-2xl text-base leading-7 text-[var(--muted)]">Maçın bittikten sonra kaydını bul, en güzel pozisyonları tekrar izle. Üyeler için arşiv erişimi ücretsiz.</p>
  </div></section>;
}

