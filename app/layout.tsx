import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { LibraryProvider } from "@/components/library-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crate — PS5 game library",
  description:
    "A PS5-style shelf of physical game cases, with loans, sale prices, and disc photos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  );
}
