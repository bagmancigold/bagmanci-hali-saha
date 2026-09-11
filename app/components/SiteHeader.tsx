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

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-stone-200/90 bg-[#FCFDF9]/95 backdrop-blur-md transition-colors duration-200 dark:border-emerald-900/40 dark:bg-[#051811]/95">
      {/* 1. KATMAN: KALIN VE MERKEZLİ ANA BAR (h-20: 80px) */}
      <div className="relative mx-auto flex h-20 max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* SOL TARAF: MOBİL MENÜ BUTONU & MASAÜSTÜ SOL LİNKLER */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-300 bg-white p-2 text-stone-900 shadow-sm transition hover:bg-stone-100 dark:border-emerald-800/60 dark:bg-[#07241a] dark:text-white md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden items-center gap-6 text-xs font-black uppercase tracking-wider md:flex">
            <a
              href="#paketler"
              className="text-stone-700 transition hover:text-amber-500 dark:text-stone-300 dark:hover:text-amber-400"
            >
              Paketler
            </a>
            <a
              href="#rezervasyon"
              className="flex items-center gap-1.5 text-stone-700 transition hover:text-amber-500 dark:text-stone-300 dark:hover:text-amber-400"
            >
              <CalendarDays size={15} className="text-amber-500" /> Rezervasyon
            </a>
          </div>
        </div>

        {/* ORTA TARAF: BÜYÜK VE MERKEZLİ 'BAĞMANCI HALI SAHA' */}
        <a
          href="/"
          aria-label="BAĞMANCI HALI SAHA ana sayfa"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 sm:gap-3 whitespace-nowrap"
        >
          <span
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-500 ring-2 ring-amber-400/40 shadow-sm dark:bg-amber-400/10"
            data-site-logo
          >
            <SiteLogo size={24} />
          </span>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-[#081b13] dark:text-white">
              BAĞMANCI
            </span>
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
              HALI SAHA
            </span>
          </div>
        </a>

        {/* SAĞ TARAF: TEMA & HESABIM */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-6 text-xs font-black uppercase tracking-wider mr-2 md:flex">
            <a
              href="#kayitlar"
              className="flex items-center gap-1.5 text-stone-700 transition hover:text-amber-500 dark:text-stone-300 dark:hover:text-amber-400"
            >
              <Play size={15} className="text-amber-500" /> Maç Tekrarı
            </a>
            <a
              href="#iletisim"
              className="text-stone-700 transition hover:text-amber-500 dark:text-stone-300 dark:hover:text-amber-400"
            >
              İletişim
            </a>
          </div>

          <ThemeToggle />

          {userName ? (
            <div className="relative">
              <button
                type="button"
                className="flex h-11 items-center gap-1.5 sm:gap-2 rounded-2xl border border-amber-400/70 bg-amber-400/10 px-3 sm:px-4 text-xs font-bold text-stone-900 shadow-sm transition hover:bg-amber-400 hover:text-black dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
                onClick={() => setAccountOpen((value) => !value)}
              >
                <UserRound size={15} className="text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Hesabım</span>
                <ChevronDown size={14} className="opacity-70" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-3 text-xs shadow-2xl dark:border-emerald-800/60 dark:bg-[#062016] dark:text-white">
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Giriş yapıldı</p>
                  <strong className="block truncate text-sm font-extrabold text-stone-900 dark:text-white">
                    {userName}
                  </strong>
                  <div className="my-2.5 h-px bg-stone-200 dark:bg-emerald-900/40" />
                  <a
                    href="/hesabim"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5"
                  >
                    <Settings size={15} /> Ayarlar
                  </a>
                  <a
                    href="/hesabim#rezervasyonlar"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5"
                  >
                    <ArrowRight size={15} /> Rezervasyonlarım
                  </a>
                  <a
                    href="/hesabim#abonelik"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5"
                  >
                    <ArrowRight size={15} /> Aboneliklerim
                  </a>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <LogOut size={15} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/musteri"
              className="flex h-11 items-center gap-1.5 rounded-2xl bg-amber-400 px-3.5 sm:px-5 text-xs font-black text-black shadow-md transition hover:bg-amber-300"
            >
              <UserRound size={15} /> <span>GİRİŞ YAP</span>
            </a>
          )}
        </div>
      </div>

      {/* MOBİL AÇILIR MENÜ */}
      {open && (
        <nav className="flex flex-col gap-2 border-t border-stone-200 bg-white/95 px-5 py-4 text-sm font-bold shadow-2xl backdrop-blur-xl dark:border-emerald-900/40 dark:bg-[#051811]/95 md:hidden">
          <a
            href="#paketler"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-stone-900 transition hover:bg-stone-100 dark:text-white dark:hover:bg-white/5"
          >
            Paketler
          </a>
          <a
            href="#rezervasyon"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-stone-900 transition hover:bg-stone-100 dark:text-white dark:hover:bg-white/5"
          >
            <CalendarDays size={16} className="text-amber-500" /> Rezervasyon
          </a>
          <a
            href="#kayitlar"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-stone-900 transition hover:bg-stone-100 dark:text-white dark:hover:bg-white/5"
          >
            <Play size={16} className="text-amber-500" /> Maç Tekrarı
          </a>
          <a
            href="#iletisim"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-stone-900 transition hover:bg-stone-100 dark:text-white dark:hover:bg-white/5"
          >
            İletişim
          </a>
        </nav>
      )}
    </header>
  );
}