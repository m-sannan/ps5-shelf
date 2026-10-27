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
  title: "Crate — Track & rate your PS5 game shelf · by Sannan (Mohammed Sannan V S)",
  description:
    "Crate by Sannan (Mohammed Sannan V S) — Letterboxd for your PS5 discs. Pin your four favourites, write short takes, share a public shelf card, and sync with no login.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Crate — Track & rate your PS5 game shelf · by Sannan (Mohammed Sannan V S)",
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
    title: "Crate — Track & rate your PS5 game shelf · by Sannan (Mohammed Sannan V S)",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: "{\"@context\": \"https://schema.org\", \"@type\": \"SoftwareApplication\", \"name\": \"Crate\", \"applicationCategory\": \"EntertainmentApplication\", \"operatingSystem\": \"Web, iOS, Android\", \"url\": \"https://ps5-shelf.vercel.app/\", \"image\": \"https://ps5-shelf.vercel.app/icon-512.png\", \"description\": \"Crate \\u2014 Letterboxd for your PS5 discs. Track, rate, and share your PlayStation 5 game shelf with zero login. Built by Sannan (Mohammed Sannan V S).\", \"offers\": {\"@type\": \"Offer\", \"price\": \"0\", \"priceCurrency\": \"INR\"}, \"author\": {\"@type\": \"Person\", \"@id\": \"https://msannan.vercel.app/#sannan\", \"name\": \"Mohammed Sannan V S\", \"givenName\": \"Sannan\", \"additionalName\": \"Mohammed\", \"alternateName\": [\"Sannan\", \"Mohammed Sannan\", \"Mohammed Sannan V S\", \"Sannan V S\", \"m-sannan\", \"sannanvs\"], \"description\": \"Sannan (Mohammed Sannan V S) is a Product Manager at Alyve Health and builder in Bangalore.\", \"jobTitle\": \"Product Manager\", \"url\": \"https://msannan.vercel.app/\", \"sameAs\": [\"https://msannan.vercel.app/\", \"https://www.linkedin.com/in/mohammedsannan/\", \"https://github.com/m-sannan\", \"https://m-sannan.github.io/\", \"https://x.com/sannanvs\", \"https://www.producthunt.com/@sannan\", \"https://www.figma.com/@mohammedsannanv\", \"https://chromewebstore.google.com/detail/staycheck/mjgdchcpacfmgocenlemmbecmcbiahkb\", \"https://otherspe.vercel.app/\", \"https://ps5-shelf.vercel.app/\"]}}",
          }}
        />
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  );
}
