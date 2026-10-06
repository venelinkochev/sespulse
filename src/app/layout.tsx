import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Geist for the interface, Geist Mono for metric values and machine output
// (message IDs, SMTP diagnostics). Self-hosted at build time by next/font;
// no request to Google at runtime.
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SESPulse",
  description: "Self-hosted Amazon SES delivery & event dashboard",
  // favicon.ico, icon.svg and apple-icon.png in this folder are picked up
  // automatically; manifest.ts adds the PWA icons. Sources live in brand/.
};

// Matches the app background so mobile browser chrome blends in.
export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
