import type { Metadata } from "next";
import "./globals.css";
import AdminSettingsShortcut from "./components/AdminSettingsShortcut";

export const metadata: Metadata = {
  title: "Bağmancı Halı Saha | Maçın adresi belli",
  description: "Bağmancı Halı Saha için paket seçin, saatinizi ayırtın ve takımınızı maça hazırlayın."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}<AdminSettingsShortcut /></body>
    </html>
  );
}
