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
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-stone-200/90 bg-[#FCFDF9] text-stone-900 shadow-sm transition-colors duration-200 dark:border-emerald-900/40 dark:bg-[#051811] dark:text-white">
      {/* 1. KATMAN: LOGO & KONTROLLER */}
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="rounded-xl border border-stone-300 p-2 text-stone-800 transition hover:bg-stone-100 dark:border-emerald-800/60 dark:text-white dark:hover:bg-emerald-950 md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* LOGO VE MARKA ADI: 'BAĞMANCI' RENGİ KESİN OLARAK SİYAH / KOYU ANTRASİT YAPILDI */}
          <a
            href="/"
            aria-label="BAĞMANCI HALI SAHA ana sayfa"
            className="flex items-center gap-2.5 text-lg font-black tracking-tight"
          >
            <span className="flex items-center text-amber-500" data-site-logo>
              <SiteLogo size={28} />
            </span>
            <span className="font-extrabold tracking-normal">
              <span className="text-[#091510] dark:text-white">BAĞMANCI </span>
              <span className="text-emerald-700 dark:text-emerald-400">HALI SAHA</span>
            </span>
          </a>
        </div>

        {/* SAĞ KISIM: TEMA SEÇİCİ & KULLANICI HESABI */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {userName ? (
            <div className="relative">
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border border-amber-400/80 bg-amber-400/10 px-3.5 text-xs font-bold text-stone-900 transition hover:bg-amber-400 hover:text-black dark:border-amber-400/50 dark:bg-amber-400/10 dark:text-amber-300"
                onClick={() => setAccountOpen((value) => !value)}
              >
                <UserRound size={15} className="text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Hesabım</span>
                <ChevronDown size={14} className="opacity-70" />
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
              className="flex h-10 items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-black text-black shadow-sm transition hover:bg-amber-300"
            >
              <UserRound size={15} /> <span>GİRİŞ YAP</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. KATMAN: ZARİF ALT MENÜ (HAP BUTONLAR TAMAMEN KALDIRILDI, ŞIK VE TEMİZ METİN LİNKLERİ) */}
      <nav
        className="hidden w-full border-t border-stone-200/80 bg-stone-100/70 py-2.5 dark:border-emerald-900/30 dark:bg-[#03130d]/80 md:block"
        aria-label="Ana navigasyon"
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-8 px-4 text-xs font-bold uppercase tracking-wider sm:px-6 lg:px-8">
          <a
            href="#paketler"
            className="text-stone-600 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            Paketler
          </a>
          <a
            href="#rezervasyon"
            className="flex items-center gap-1.5 text-stone-600 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            <CalendarDays size={14} className="text-amber-500" /> Rezervasyon
          </a>
          <a
            href="#kayitlar"
            className="flex items-center gap-1.5 text-stone-600 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            <Play size={14} className="text-amber-500" /> Maç Tekrarı
          </a>
          <a
            href="#iletisim"
            className="text-stone-600 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400"
          >
            İletişim
          </a>
        </div>
      </nav>

      {/* MOBİL AÇILIR MENÜ */}
      {open && (
        <nav className="flex flex-col gap-3 border-t border-stone-200 bg-white px-5 py-4 text-sm font-bold shadow-xl dark:border-emerald-900/40 dark:bg-[#051811] md:hidden">
          <a
            href="#paketler"
            onClick={() => setOpen(false)}
            className="py-1.5 text-stone-900 transition hover:text-amber-500 dark:text-white"
          >
            Paketler
          </a>
          <a
            href="#rezervasyon"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 py-1.5 text-stone-900 transition hover:text-amber-500 dark:text-white"
          >
            <CalendarDays size={16} className="text-amber-500" /> Rezervasyon
          </a>
          <a
            href="#kayitlar"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 py-1.5 text-stone-900 transition hover:text-amber-500 dark:text-white"
          >
            <Play size={16} className="text-amber-500" /> Maç Tekrarı
          </a>
          <a
            href="#iletisim"
            onClick={() => setOpen(false)}
            className="py-1.5 text-stone-900 transition hover:text-amber-500 dark:text-white"
          >
            İletişim
          </a>
        </nav>
      )}
    </header>
  );
}