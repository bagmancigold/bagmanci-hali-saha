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
        const { data, error } = await getSupabaseClient()
          .from("match_records")
          .select("*")
          .order("match_date", { ascending: false });
        if (!error && data && data.length > 0) {
          const formatted = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            date: d.match_date,
            field: d.field_name,
            duration: d.duration,
            image: d.thumbnail_url || "",
            video: d.video_url,
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
        ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(
            new Date(`${match.date}T12:00:00`),
          )
        : "";
      const searchable = `${match.title} ${match.date} ${dateLabel} ${match.duration} ${match.field}`.toLocaleLowerCase(
        "tr-TR",
      );
      return searchable.includes(normalizedQuery) && (field === "Tüm sahalar" || match.field === field);
    });
  }, [field, query, matches]);

  return (
    <section id="kayitlar" className="match-archive scroll-mt-32 bg-[#051811] px-5 py-20 text-white lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-8">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-amber-400">Maç kayıtları</p>
          <h2 className="display max-w-2xl text-4xl font-extrabold leading-none text-white sm:text-6xl">
            Maçın heyecanı, <span className="text-amber-400">tekrar sende.</span>
          </h2>
        </div>

        <div className="mb-10 overflow-hidden rounded-[28px] border border-emerald-800/40 bg-[#09261b] shadow-2xl backdrop-blur-md">
          <div className="relative aspect-video bg-black">
            {active?.video ? (
              <video
                key={active.video}
                controls
                poster={active.image}
                className="h-full w-full object-cover"
                src={active.video}
              >
                Tarayıcın video oynatmayı desteklemiyor.
              </video>
            ) : (
              <img src={active?.image} alt={active?.title} className="h-full w-full object-cover opacity-80" />
            )}
            <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-amber-400/40 bg-black/60 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur">
              {active?.field} · {active?.duration}
            </div>
          </div>
          <div className="p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-400">Şimdi izliyorsun</p>
            <h3 className="display mt-2 text-2xl font-extrabold text-white">{active?.title || "Maç kaydı seç"}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-200/70">
              <CalendarDays size={15} className="text-amber-400" /> {active?.date || "Arşivden bir kayıt seç"}
            </p>
          </div>
        </div>

        <div className="mb-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/70" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Saat, tarih veya maç ara..."
              className="match-filter-input box-border w-full rounded-2xl border border-emerald-800/50 bg-[#0a2318] py-3.5 pl-11 pr-4 text-white outline-none placeholder:text-white/30 focus:border-amber-400"
            />
          </label>
          <select
            value={field}
            onChange={(event) => setField(event.target.value)}
            className="match-filter-input box-border w-full rounded-2xl border border-emerald-800/50 bg-[#0a2318] py-3.5 px-4 text-white outline-none focus:border-amber-400 sm:max-w-[180px]"
          >
            <option className="bg-[#051811] text-white">Tüm sahalar</option>
            <option className="bg-[#051811] text-white">Saha 1</option>
            <option className="bg-[#051811] text-white">Saha 2</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((match) => (
              <button
                type="button"
                key={match.id}
                onClick={() => setActive(match)}
                className={`match-card flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  active?.id === match.id
                    ? "border-amber-400 bg-[#0e3a29] text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                    : "border-emerald-800/40 bg-[#09261b] text-white hover:border-amber-400/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <img src={match.image} alt="" className="h-14 w-20 rounded-xl object-cover" />
                  <span>
                    <strong className="block text-base font-bold text-white">{match.title}</strong>
                    <small className="text-xs text-emerald-200/60">
                      {match.date} · {match.field} · {match.duration}
                    </small>
                  </span>
                </div>
                <ChevronRight size={18} className="text-amber-400" />
              </button>
            ))
          ) : (
            <p className="match-empty-state rounded-2xl border border-emerald-800/40 bg-[#09261b] p-6 text-sm font-semibold text-white/60">
              Bu aramaya uygun kayıt bulunamadı.
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <article className="match-step rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
            <span className="text-xs font-bold text-amber-400">01</span>
            <Video size={21} className="my-2 text-amber-400" />
            <h3 className="font-bold text-white">Kameralar kaydeder</h3>
            <p className="mt-1 text-xs text-emerald-200/70 leading-5">Maçın boyunca saha görüntüsü güvenli biçimde kayda alınır.</p>
          </article>
          <article className="match-step rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
            <span className="text-xs font-bold text-amber-400">02</span>
            <ShieldCheck size={21} className="my-2 text-amber-400" />
            <h3 className="font-bold text-white">Kayıt arşive düşer</h3>
            <p className="mt-1 text-xs text-emerald-200/70 leading-5">Maç tamamlanınca tarih ve saha bilgisiyle arşivlenir.</p>
          </article>
          <article className="match-step rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
            <span className="text-xs font-bold text-amber-400">03</span>
            <Play size={21} className="my-2 text-amber-400" />
            <h3 className="font-bold text-white">Tekrarını izle</h3>
            <p className="mt-1 text-xs text-emerald-200/70 leading-5">Hesabından kaydı aç, pozisyonları ve maçın tamamını izle.</p>
          </article>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-6 text-emerald-200/60">
          Maçın bittikten sonra kaydını bul, en güzel pozisyonları tekrar izle. Üyeler için arşiv erişimi ücretsiz.
        </p>
      </div>
    </section>
  );
}