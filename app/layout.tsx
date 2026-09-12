import type { Metadata } from "next";
import ThemeProvider from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bağmancı Halı Saha | Maçın adresi belli",
  description: "Bağmancı Halı Saha için paket seçin, saatinizi ayırtın ve takımınızı maça hazırlayın.",
  verification: {
    google: "_inhOjOnnu_teMUeWlzPxQQw_AjqBZSj_0k3lrJ6z-Y"
  },
  other: {
    "facebook-domain-verification": "8y32n4qy3h7kfdnbdc3j23ojbpb70e"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className="w-full max-w-[100vw] overflow-x-hidden bg-[var(--cream)] text-[var(--ink)] transition-colors duration-300 antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
