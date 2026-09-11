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
          const heroBackground = settings.hero_image || defaultSiteImages.hero;
          // Zümrüt yeşili overlay ile birleştirilmiş koyu arka plan:
          heroSection.style.backgroundImage = `linear-gradient(rgba(5, 24, 17, .88), rgba(5, 24, 17, .95)), url("${heroBackground}")`;
          heroSection.style.backgroundSize = "cover";
          heroSection.style.backgroundPosition = "center";
          heroSection.style.backgroundColor = "#051811";
        }

        const favicon = settings.favicon_image || defaultSiteImages.favicon;
        let faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!faviconLink) {
          faviconLink = document.createElement("link");
          faviconLink.rel = "icon";
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = favicon;

        // Arka plan değişkenini sadece koyu zümrütle harmanlanmış şekilde ata, ASLA saf beyaz zemin bırakma:
        if (settings.background_image) {
          document.documentElement.style.setProperty(
            "--booking-background",
            `linear-gradient(rgba(5, 24, 17, 0.92), rgba(5, 24, 17, 0.96)), url("${settings.background_image}")`,
          );
        } else {
          document.documentElement.style.setProperty(
            "--booking-background",
            "#051811",
          );
        }
        document.documentElement.style.setProperty("--booking-background-size", "cover");

        const logoMount = document.querySelector<HTMLElement>("[data-site-logo]");
        if (logoMount && settings.logo_image) {
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
          logoImg.src = settings.logo_image;
          logoImg.style.objectFit = settings.logo_fit || defaultImageFits.logo;
        }
      } catch {
        return;
      }
    };
    syncImages();
  }, []);

  return null;
}