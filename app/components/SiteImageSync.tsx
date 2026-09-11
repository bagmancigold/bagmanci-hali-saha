"use client";

import { useEffect } from "react";
import { defaultImageFits, defaultSiteImages, type ImageFit } from "../../lib/siteSettings";

type SiteSettingsRow = {
  hero_image?: string;
  match_image?: string;
  background_image?: string;
  favicon_image?: string;
  logo_image?: string;
  hero_fit?: ImageFit;
  match_fit?: ImageFit;
  background_fit?: ImageFit;
  logo_fit?: ImageFit;
};

const BASE_COLUMNS = "hero_image, match_image, background_image";
const EXTRA_COLUMNS = "favicon_image, logo_image, hero_fit, match_fit, background_fit, logo_fit";

export default function SiteImageSync() {
  useEffect(() => {
    const syncImages = async () => {
      try {
        const { getSupabaseClient } = await import("../../lib/supabase");
        const client = getSupabaseClient();
        let settings: SiteSettingsRow | null = null;
        const full = await client
          .from("site_settings")
          .select(`${BASE_COLUMNS}, ${EXTRA_COLUMNS}`)
          .eq("id", "main")
          .maybeSingle();
        if (full.error) {
          // newer columns (logo/fit/favicon) may not exist yet on this database;
          // retry with only the original columns so hero/match/background still sync.
          const partial = await client
            .from("site_settings")
            .select(BASE_COLUMNS)
            .eq("id", "main")
            .maybeSingle();
          settings = partial.data;
        } else {
          settings = full.data;
        }
        settings = settings ?? {};

        const hero = document.querySelector<HTMLImageElement>(
          'img[alt="Bağmancı Halı Saha"]',
        );
        const match = document.querySelector<HTMLImageElement>(
          'img[alt="Bağmancı Halı Saha maç kaydı"]',
        );
        const heroSection = document.querySelector<HTMLElement>("section.noise");

        if (hero) {
          hero.src = settings.hero_image || defaultSiteImages.hero;
          hero.style.objectFit = settings.hero_fit || defaultImageFits.hero;
        }
        if (match) {
          match.src = settings.match_image || defaultSiteImages.match;
          match.style.objectFit = settings.match_fit || defaultImageFits.match;
        }
        if (heroSection) {
          // Hero section backdrop uses hero_image, kept fully separate from the
          // reservation card's own background_image so they never end up identical.
          const heroBackground = settings.hero_image || defaultSiteImages.hero;
          heroSection.style.backgroundImage = `linear-gradient(rgba(21, 67, 47, .82), rgba(21, 67, 47, .88)), linear-gradient(rgba(255, 255, 255, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .07) 1px, transparent 1px), url("${heroBackground}")`;
          heroSection.style.backgroundSize = `cover, 42px 42px, 42px 42px, ${settings.hero_fit || defaultImageFits.hero}`;
          heroSection.style.backgroundPosition = "center, center, center, center";
          heroSection.style.backgroundRepeat = "no-repeat, repeat, repeat, no-repeat";
        }

        const favicon = settings.favicon_image || defaultSiteImages.favicon;
        let faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!faviconLink) {
          faviconLink = document.createElement("link");
          faviconLink.rel = "icon";
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = favicon;

        // Reservation card background lives only in --booking-background so it never
        // gets mixed up with the hero section's own look.
        const backgroundFit = settings.background_fit || defaultImageFits.background;
        document.documentElement.style.setProperty(
          "--booking-background",
          `url("${settings.background_image || defaultSiteImages.background}")`,
        );
        document.documentElement.style.setProperty("--booking-background-size", backgroundFit);

        const logoMount = document.querySelector<HTMLElement>("[data-site-logo]");
        if (logoMount) {
          const logoUrl = settings.logo_image;
          if (logoUrl) {
            let logoImg = logoMount.querySelector<HTMLImageElement>("img[data-site-logo-image]");
            if (!logoImg) {
              logoMount.innerHTML = "";
              logoImg = document.createElement("img");
              logoImg.dataset.siteLogoImage = "true";
              logoImg.alt = "Bağmancı Halı Saha logosu";
              logoImg.style.width = "100%";
              logoImg.style.height = "100%";
              logoMount.appendChild(logoImg);
            }
            logoImg.src = logoUrl;
            logoImg.style.objectFit = settings.logo_fit || defaultImageFits.logo;
          }
        }
      } catch {
        return;
      }
    };
    syncImages();
  }, []);

  return null;
}

