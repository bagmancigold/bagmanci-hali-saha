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
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-stone-200/80 bg-[#FCFDF9]/95 backdrop-blur-md transition-colors duration-200 dark:border-emerald-900/40 dark:bg-[#051811]/95">
      {/* ÜST KATMAN: LOGO & KONTROLLER */}
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white/80 p-1.5 text-stone-800 transition hover:bg-stone-100 dark:border-emerald-800/60 dark:bg-[#07241a] dark:text-white md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>

          {/* ASLA KIRILMAYAN TEK SATIR LÜKS LOGO */}
          <a
            href="/"
            aria-label="BAĞMANCI HALI SAHA ana sayfa"
            className="flex items-center gap-2 whitespace-nowrap min-w-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500 ring-1 ring-amber-400/30 dark:bg-amber-400/10" data-site-logo>
              <SiteLogo size={22} />
            </span>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap font-black tracking-tight">
              <span className="text-sm sm:text-base text-[#081b13] dark:text-white">
                BAĞMANCI
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                HALI SAHA
              </span>
            </div>
          </a>
        </div>

        {/* SAĞ KONTROLLER: TEMA & HESAP */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />

          {userName ? (
            <div className="relative">
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 sm:gap-2 rounded-xl border border-amber-400/60 bg-amber-400/10 px-2.5 sm:px-3.5 text-xs font-bold text-stone-900 shadow-sm transition hover:bg-amber-400 hover:text-black dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
                onClick={() => setAccountOpen((value) => !value)}
              >
                <UserRound size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Hesabım</span>
                <ChevronDown size={13} className="opacity-70 shrink-0" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-3 text-xs shadow-2xl dark:border-emerald-800/60 dark:bg-[#062016] dark:text-white">
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Giriş yapıldı</p>
                  <strong className="block truncate text-sm font-extrabold text-stone-900 dark:text-white">{userName}</strong>
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
              className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-400 px-3 sm:px-4 text-xs font-black text-black shadow-sm transition hover:bg-amber-300"
            >
              <UserRound size={14} /> <span>GİRİŞ YAP</span>
            </a>
          )}
        </div>
      </div>

      {/* ALT KATMAN: MASAÜSTÜ NAVİGASYON */}
      <nav
        className="hidden w-full border-t border-stone-200/70 bg-stone-100/60 py-2.5 backdrop-blur-sm dark:border-emerald-900/30 dark:bg-[#03130d]/80 md:block"
        aria-label="Ana navigasyon"
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-8 px-4 text-xs font-bold uppercase tracking-wider sm:px-6 lg:px-8">
          <a
            href="#paketler"
            className="text-stone-600 transition hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            Paketler
          </a>
          <a
            href="#rezervasyon"
            className="flex items-center gap-1.5 text-stone-600 transition hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            <CalendarDays size={14} className="text-amber-500" /> Rezervasyon
          </a>
          <a
            href="#kayitlar"
            className="flex items-center gap-1.5 text-stone-600 transition hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            <Play size={14} className="text-amber-500" /> Maç Tekrarı
          </a>
          <a
            href="#iletisim"
            className="text-stone-600 transition hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            İletişim
          </a>
        </div>
      </nav>

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