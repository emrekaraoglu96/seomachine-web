import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO — AI-Powered SEO Content That Ranks",
  description:
    "From topic to publish-ready article in minutes. AI keyword research, brand-voice writing, and real-time SEO scoring for B2B marketing teams.",
  openGraph: {
    title: "SEO — AI-Powered SEO Content That Ranks",
    description:
      "From topic to publish-ready article in minutes. AI keyword research, brand-voice writing, and real-time SEO scoring for B2B marketing teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
