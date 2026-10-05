import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SESPulse",
  description: "Self-hosted Amazon SES delivery & event dashboard",
  // favicon.ico, icon.svg and apple-icon.png in this folder are picked up
  // automatically; manifest.ts adds the PWA icons. Sources live in brand/.
};

// Matches the app background so mobile browser chrome blends in.
export const viewport: Viewport = {
  themeColor: "#0b0d12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-fg font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
