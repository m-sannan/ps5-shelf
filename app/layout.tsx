import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { LibraryProvider } from "@/components/library-provider";
import { ProfileGate } from "@/components/profile-gate";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <LibraryProvider>
          <ProfileGate>{children}</ProfileGate>
        </LibraryProvider>
      </body>
    </html>
  );
}
