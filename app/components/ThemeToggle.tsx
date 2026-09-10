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

  // Avoid hydration mismatch: render a stable placeholder until the client resolves the theme.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="theme-toggle-button"
        style={{ visibility: "hidden" }}
      />
    );
  }

  const active = theme ?? "system";
  const ActiveIcon =
    OPTIONS.find((option) => option.value === active)?.Icon ??
    (resolvedTheme === "dark" ? Moon : Sun);

  return (
    <div className="theme-toggle" ref={rootRef}>
      <button
        type="button"
        className="theme-toggle-button"
        aria-label="Tema seç"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ActiveIcon size={15} />
      </button>
      {open && (
        <div className="theme-toggle-panel" role="menu">
          {OPTIONS.map(({ value, label, Icon }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`theme-toggle-option${isActive ? " theme-toggle-option-active" : ""}`}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
                {isActive && <Check size={13} className="theme-toggle-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
