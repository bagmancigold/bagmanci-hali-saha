"use client";

import { Moon } from "lucide-react";

// Theme is permanently locked to dark (see ThemeProvider forcedTheme="dark"); this is a
// static brand indicator only, it never switches to a sun icon or toggles anything.
export default function ThemeToggle() {
  return (
    <div className="theme-toggle">
      <button
        type="button"
        className="theme-toggle-button"
        aria-label="Koyu tema aktif"
        title="Koyu tema aktif"
        disabled
      >
        <Moon size={15} />
      </button>
    </div>
  );
}
