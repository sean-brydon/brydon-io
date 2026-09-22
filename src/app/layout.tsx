import type { Metadata } from "next";
import { Caveat, Geist_Mono, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Sean Brydon",
  description:
    "Sean Brydon. Take an instant photo, sign it with your X handle, and toss it on the table.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        inter.variable,
        interHeading.variable,
        geistMono.variable,
        caveat.variable,
      )}
    >
      <body className="min-h-full font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
