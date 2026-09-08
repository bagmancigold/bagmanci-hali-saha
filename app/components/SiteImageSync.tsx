"use client";

import { useEffect } from "react";
import { defaultSiteImages } from "../../lib/siteSettings";

export default function SiteImageSync() {
  useEffect(() => {
    const syncImages = async () => {
      try {
        const { getSupabaseClient } = await import("../../lib/supabase");
        const { data } = await getSupabaseClient().from("site_settings").select("hero_image, match_image, background_image").eq("id", "main").maybeSingle();
        if (!data) return;
        const hero = document.querySelector<HTMLImageElement>('img[alt="Bağmancı Halı Saha"]');
        const match = document.querySelector<HTMLImageElement>('img[alt="Bağmancı Halı Saha maç kaydı"]');
        const field = document.querySelector<HTMLElement>("section.noise");
        if (hero) hero.src = data.hero_image || defaultSiteImages.hero;
        if (match) match.src = data.match_image || defaultSiteImages.match;
        if (field && data.background_image) {
          field.style.backgroundImage = `linear-gradient(rgba(21, 67, 47, .82), rgba(21, 67, 47, .88)), url("${data.background_image}")`;
          field.style.backgroundSize = "cover";
          field.style.backgroundPosition = "center";
        }
      } catch {
        return;
      }
    };
    syncImages();
  }, []);

  return null;
}
