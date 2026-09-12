import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { LibraryProvider } from "@/components/library-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crate — PS5 disc library",
  description:
    "Track physical PS5 games like a vinyl collection: loans, sale prices, play status, and real disc photos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  );
}
