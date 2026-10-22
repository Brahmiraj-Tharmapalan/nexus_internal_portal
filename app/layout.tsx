import type { Metadata } from "next";
import { DM_Serif_Display, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internal Task Portal",
  description: "Manage your own tasks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-sans", sans.variable, display.variable, geistMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="light" position="top-right" />
      </body>
    </html>
  );
}
