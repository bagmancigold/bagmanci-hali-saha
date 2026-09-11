"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  Play,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import SiteLogo from "./SiteLogo";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const client = getSupabaseClient();
    const loadUser = async () => {
      const { data } = await client.auth.getUser();
      setUserName(data.user?.user_metadata?.full_name || "Abdullah BAĞMANCI");
    };
    loadUser();
    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        setUserName(
          session?.user?.user_metadata?.full_name ||
            (session ? "Abdullah BAĞMANCI" : ""),
        );
        setAccountOpen(false);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setAccountOpen(false);
    setUserName("");
  };

  // Butonlara tıklandığında doğrudan ilgili alana akıcı kaydırma
  const scrollTo = (id: string) => {
    setOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-[#0c3826] bg-[#05261b] text-white shadow-xl">
      {/* 1. KATMAN: ÜST ANA BAR (LOGO, MENÜ, TEMA, HESAP) */}
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-3 sm:px-6">
        
        {/* SOL: MOBİL MENÜ BUTONU */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#093324] border border-[#144f37] text-white transition hover:bg-[#0e422f] md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* ORTA: SARI KARELİ KOŞUCU LOGOSU + BAĞMANCI HALI SAHA */}
        <a
          href="/"
          aria-label="BAĞMANCI HALI SAHA ana sayfa"
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black shadow-sm"
            data-site-logo
          >
            <SiteLogo size={18} />
          </span>
          <div className="flex items-center gap-1.5 font-black tracking-tight">
            <span className="text-sm sm:text-base font-extrabold text-white">
              BAĞMANCI
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400">
              HALI SAHA
            </span>
          </div>
        </a>

        {/* SAĞ: TEMA BUTONU & SARI HESABIM BUTONU */}
        <div className="flex items-center gap-2">
          {/* YUVARLAK TEMA BUTONU */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#093324] border border-[#144f37] text-white overflow-hidden">
            <ThemeToggle />
          </div>

          {/* SARI HESABIM BUTONU */}
          {userName ? (
            <div className="relative">
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-full bg-amber-400 px-3 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-300"
                onClick={() => setAccountOpen((value) => !value)}
              >
                <UserRound size={13} className="text-slate-950 shrink-0" />
                <span className="text-[11px] sm:text-xs">Hesabım</span>
                <ChevronDown size={12} className="opacity-80 shrink-0" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-emerald-800/60 bg-[#062016] p-3 text-xs text-white shadow-2xl backdrop-blur-xl">
                  <p className="text-[11px] font-medium text-stone-400">Giriş yapıldı</p>
                  <strong className="block truncate text-sm font-extrabold text-white">
                    {userName}
                  </strong>
                  <div className="my-2 h-px bg-emerald-900/40" />
                  <a
                    href="/hesabim"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-stone-200 transition hover:bg-white/5"
                  >
                    <Settings size={14} /> Ayarlar
                  </a>
                  <a
                    href="/hesabim#rezervasyonlar"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-stone-200 transition hover:bg-white/5"
                  >
                    <ArrowRight size={14} /> Rezervasyonlarım
                  </a>
                  <a
                    href="/hesabim#abonelik"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-stone-200 transition hover:bg-white/5"
                  >
                    <ArrowRight size={14} /> Aboneliklerim
                  </a>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-bold text-rose-400 transition hover:bg-rose-950/30"
                  >
                    <LogOut size={14} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/musteri"
              className="flex h-8 items-center gap-1 rounded-full bg-amber-400 px-3 text-xs font-black text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              <UserRound size={13} /> <span>GİRİŞ</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. KATMAN: FOTOĞRAFTAKİ İKİ KAPSÜL BUTON (DOĞRUDAN REZERVASYON VE MAÇ TEKRARINA GÖNDERİR) */}
      <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 px-3 pb-2.5 pt-0.5">
        <button
          type="button"
          onClick={() => scrollTo("rezervasyon")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#093324] border border-[#144f37] py-2 px-3 text-[11px] sm:text-xs font-bold text-white shadow-inner transition hover:bg-[#0e422f] active:scale-[0.98]"
        >
          <CalendarDays size={14} className="text-amber-400 shrink-0" />
          <span>Rezervasyon</span>
        </button>

        <button
          type="button"
          onClick={() => scrollTo("kayitlar")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#093324] border border-[#144f37] py-2 px-3 text-[11px] sm:text-xs font-bold text-white shadow-inner transition hover:bg-[#0e422f] active:scale-[0.98]"
        >
          <Play size={13} className="text-amber-400 shrink-0" />
          <span>Maç Tekrarı</span>
        </button>

        {/* Masaüstü Ekstra Butonlar */}
        <button
          type="button"
          onClick={() => scrollTo("paketler")}
          className="hidden md:flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#093324] border border-[#144f37] py-2 px-3 text-xs font-bold text-white transition hover:bg-[#0e422f]"
        >
          <span>Paketler</span>
        </button>

        <button
          type="button"
          onClick={() => scrollTo("iletisim")}
          className="hidden md:flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#093324] border border-[#144f37] py-2 px-3 text-xs font-bold text-white transition hover:bg-[#0e422f]"
        >
          <span>İletişim</span>
        </button>
      </div>

      {/* MOBİL AÇILIR MENÜ */}
      {open && (
        <nav className="flex flex-col gap-2 border-t border-[#0c3826] bg-[#041d14] px-5 py-4 text-sm font-bold shadow-2xl md:hidden">
          <button
            type="button"
            onClick={() => scrollTo("paketler")}
            className="text-left py-2 text-white hover:text-amber-400"
          >
            Paketler
          </button>
          <button
            type="button"
            onClick={() => scrollTo("rezervasyon")}
            className="flex items-center gap-2 text-left py-2 text-white hover:text-amber-400"
          >
            <CalendarDays size={16} className="text-amber-400" /> Rezervasyon
          </button>
          <button
            type="button"
            onClick={() => scrollTo("kayitlar")}
            className="flex items-center gap-2 text-left py-2 text-white hover:text-amber-400"
          >
            <Play size={16} className="text-amber-400" /> Maç Tekrarı
          </button>
          <button
            type="button"
            onClick={() => scrollTo("iletisim")}
            className="text-left py-2 text-white hover:text-amber-400"
          >
            İletişim
          </button>
        </nav>
      )}
    </header>
  );
}