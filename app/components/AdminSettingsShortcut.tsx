"use client";

import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminSettingsShortcut() {
  const pathname = usePathname();
  if (!pathname.startsWith("/admin") || pathname === "/admin/ayarlar") return null;
  return <a href="/admin/ayarlar" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[var(--green)] px-4 py-3 text-sm font-bold text-white shadow-xl"><Settings size={16} /> Site ayarları</a>;
}
