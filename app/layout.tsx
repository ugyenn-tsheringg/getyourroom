import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GetYourRoom — Rooms for rent in Bhutan",
  description:
    "Find rooms and flats for rent across Bhutan, or post your own listing — free, no account needed to browse.",
  // iOS "Add to Home Screen" support (Android uses the manifest above).
  // Renders apple-mobile-web-app-* meta tags; the apple-icon is auto-detected
  // from app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "GetYourRoom",
    statusBarStyle: "default",
  },
  // Explicit legacy iOS tag (Next emits the modern `mobile-web-app-capable`;
  // older iOS Safari uses the apple-prefixed one for standalone launch).
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
            <span>GetYourRoom — rooms and flats for rent across Bhutan.</span>
            <a href="/feedback" className="shrink-0 underline-offset-2 hover:text-foreground hover:underline">
              Feedback
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
