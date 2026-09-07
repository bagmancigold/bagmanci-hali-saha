import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saha Park | Oyunun merkezi",
  description: "Şehrin en iyi çim sahalarında kolayca rezervasyon yapın."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
