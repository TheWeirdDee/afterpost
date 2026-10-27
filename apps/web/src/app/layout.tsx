import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { MotionProvider } from "@/components/motion";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--f-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
const serif = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-serif", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Afterpost: know what your promoters delivered", template: "%s · Afterpost" },
  description:
    "Afterpost investigates a paid promotional campaign against real evidence and keeps delivery, observed market activity and attribution separate.",
};
export const viewport: Viewport = { themeColor: "#08090c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        <Script id="js-flag" strategy="beforeInteractive">{"document.documentElement.classList.add('js')"}</Script>
        <div className="grain" aria-hidden />
        <MotionProvider />
        {children}
      </body>
    </html>
  );
}
