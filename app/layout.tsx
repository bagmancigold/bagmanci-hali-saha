import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bağmancı Halı Saha | Maçın adresi belli",
  description: "Bağmancı Halı Saha için paket seçin, saatinizi ayırtın ve takımınızı maça hazırlayın.",
  verification: {
    google: "_inhOjOnnu_teMUeWlzPxQQw_AjqBZSj_0k3lrJ6z-Y"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="w-full max-w-[100vw] overflow-x-hidden">{children}</body>
    </html>
  );
}
