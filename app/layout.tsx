import type { Metadata } from "next";
import ThemeProvider from "./components/ThemeProvider";
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
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'&&t!=='system'){localStorage.setItem('theme','dark');t='dark';}var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="w-full max-w-[100vw] overflow-x-hidden bg-[#fcfdfa] text-slate-900 transition-colors duration-300 dark:bg-[#051811] dark:text-[#F8FAFC]"
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
