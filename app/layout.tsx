import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { LibraryProvider } from "@/components/library-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ps5-shelf.vercel.app"),
  title: "Crate — Letterboxd for your PS5 discs",
  description:
    "Crate — Letterboxd for your PS5 discs. Pin your four favourites, write short takes, share a public shelf card, and sync across devices with no login.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Crate — Letterboxd for your PS5 discs",
    description:
      "Pin your four favourites, write short takes, share a public shelf card, and sync across devices with no login.",
    url: "https://ps5-shelf.vercel.app/",
    siteName: "Crate",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Crate — Letterboxd for your PS5 discs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crate — Letterboxd for your PS5 discs",
    description:
      "Pin your four favourites, write short takes, share a public shelf card, and sync across devices with no login.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${outfit.variable} min-h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  );
}
