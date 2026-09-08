"use client";

import { useEffect } from "react";
import { defaultSiteImages } from "../../lib/siteSettings";

export default function SiteImageSync() {
  useEffect(() => {
    const syncImages = async () => {
      try {
        const { getSupabaseClient } = await import("../../lib/supabase");
        const { data } = await getSupabaseClient().from("site_settings").select("hero_image, match_image, background_image").eq("id", "main").maybeSingle();
        const settings = data ?? { hero_image: "", match_image: "", background_image: "" };
        const hero = document.querySelector<HTMLImageElement>('img[alt="Bağmancı Halı Saha"]');
        const match = document.querySelector<HTMLImageElement>('img[alt="Bağmancı Halı Saha maç kaydı"]');
        const field = document.querySelector<HTMLElement>("section.noise");
        if (hero) hero.src = settings.hero_image || defaultSiteImages.hero;
        if (match) match.src = settings.match_image || defaultSiteImages.match;
        if (field) {
          const background = settings.background_image || defaultSiteImages.background;
          field.style.backgroundImage = `linear-gradient(rgba(21, 67, 47, .82), rgba(21, 67, 47, .88)), linear-gradient(rgba(255, 255, 255, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .07) 1px, transparent 1px), url("${background}")`;
          field.style.backgroundSize = "cover, 42px 42px, 42px 42px, cover";
          field.style.backgroundPosition = "center, center, center, center";
          field.style.backgroundRepeat = "no-repeat, repeat, repeat, no-repeat";
        }
      } catch {
        return;
      }
    };
    syncImages();
  }, []);

  return null;
}
