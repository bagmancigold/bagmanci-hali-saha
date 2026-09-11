"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Açık", Icon: Sun },
  { value: "dark", label: "Koyu", Icon: Moon },
  { value: "system", label: "Sistem", Icon: Laptop },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-9 w-9 rounded-xl border border-transparent"
        style={{ visibility: "hidden" }}
      />
    );
  }

  const active = theme ?? "system";
  const ActiveIcon =
    OPTIONS.find((option) => option.value === active)?.Icon ??
    (resolvedTheme === "dark" ? Moon : Sun);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300/80 bg-white/90 text-stone-800 shadow-sm transition hover:border-amber-400 hover:text-amber-600 dark:border-emerald-800/60 dark:bg-[#07241a] dark:text-stone-200 dark:hover:border-amber-400/60 dark:hover:text-amber-300"
        aria-label="Tema seç"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ActiveIcon size={16} className="text-stone-800 dark:text-amber-400 transition-colors" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 min-w-[130px] rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl backdrop-blur-xl dark:border-emerald-800/60 dark:bg-[#062016]"
          role="menu"
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-amber-400/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300"
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isActive ? "text-amber-600 dark:text-amber-400" : "opacity-70"} />
                  <span>{label}</span>
                </div>
                {isActive && <Check size={13} className="text-amber-600 dark:text-amber-400 font-extrabold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}