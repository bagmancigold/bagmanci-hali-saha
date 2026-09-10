"use client";

import { ArrowRight, ChevronDown, LogOut, Menu, Settings, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import SiteLogo from "./SiteLogo";

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
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUserName(session?.user?.user_metadata?.full_name || (session ? "Abdullah BAĞMANCI" : ""));
      setAccountOpen(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setAccountOpen(false);
    setUserName("");
  };

  return <header className="site-header fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[var(--green)]/95 backdrop-blur-md">
    <div className="header-shell relative flex h-[76px] w-full items-center">
      <button type="button" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} className="header-icon-button header-menu-button" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      <a href="/" aria-label="BAĞMANCI HALI SAHA ana sayfa" className="header-brand display absolute left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[15px] font-extrabold tracking-[.08em] text-white sm:text-lg"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--green)]"><SiteLogo size={25} /></span><span>BAĞMANCI <span className="text-[var(--lime)]">HALI SAHA</span></span></a>
      {userName ? <div className="header-account-position"><button type="button" className="header-account-button" onClick={() => setAccountOpen((value) => !value)}><UserRound size={16} /><span>Hesabım</span><ChevronDown size={15} /></button>{accountOpen && <div className="header-account-menu"><p>Merhaba,</p><strong>{userName}</strong><a href="/hesabim"><Settings size={15} /> Ayarlar</a><a href="/hesabim#rezervasyonlar"><ArrowRight size={15} /> Rezervasyonlarım</a><a href="/hesabim#abonelik"><ArrowRight size={15} /> Aboneliklerim</a><button type="button" onClick={signOut}><LogOut size={15} /> Çıkış Yap</button></div>}</div> : <a href="/musteri" className="header-login-button header-login-position"><span className="header-login-full">GİRİŞ YAP</span><span className="header-login-short">GİRİŞ</span><ArrowRight size={16} /></a>}
    </div>
    <nav className={`${open ? "flex" : "hidden"} mx-5 mb-4 flex-col gap-5 rounded-2xl bg-white p-6 text-[var(--ink)] shadow-xl`}><a className="text-sm font-semibold" href="#rezervasyon" onClick={() => setOpen(false)}>Rezervasyon</a><a className="text-sm font-semibold" href="#paketler" onClick={() => setOpen(false)}>Paketler</a><a className="text-sm font-semibold" href="#kayitlar" onClick={() => setOpen(false)}>Maç kayıtları</a><a className="text-sm font-semibold" href="#iletisim" onClick={() => setOpen(false)}>İletişim</a></nav>
  </header>;
}
