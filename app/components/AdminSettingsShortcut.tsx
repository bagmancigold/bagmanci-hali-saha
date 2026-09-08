"use client";

import { LogOut, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";

export default function AdminSettingsShortcut() {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!pathname.startsWith("/admin") || pathname === "/admin/ayarlar") return;
    const client = getSupabaseClient();
    const check = () => client.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => setAuthorized(Boolean(data?.currentLevel === "aal2")));
    check();
    const { data: listener } = client.auth.onAuthStateChange(() => { check(); });
    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  if (!authorized || !pathname.startsWith("/admin")) return null;

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    window.location.href = "/admin";
  };

  return <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2"><a href="/admin/ayarlar" className="flex items-center gap-2 rounded-full bg-[var(--lime)] px-5 py-3 text-sm font-extrabold text-[var(--green)] shadow-2xl ring-2 ring-white/80"><Settings size={16} /> Site ayarları</a><button onClick={signOut} className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-red-700 shadow-2xl ring-2 ring-red-100"><LogOut size={16} /> Çıkış yap</button></div>;
}
