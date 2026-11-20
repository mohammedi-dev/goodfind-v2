import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { directory } from "@/directory.config";
import "./globals.css";
import "./discovery.css";

const font = localFont({
  src: "./fonts/Manrope.ttf",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: directory.title,
  description: directory.description,
  metadataBase: new URL(directory.baseUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
