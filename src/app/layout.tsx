import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SESPulse",
  description: "Self-hosted Amazon SES delivery & event dashboard",
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
