import type { Metadata } from "next";
import { JetBrains_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { A11yWidget } from "@/components/a11y-widget";

const font = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const dyslexicFont = Lexend({
  subsets: ["latin"],
  variable: "--font-dyslexic",
});

export const metadata: Metadata = {
  title: {
    default: "sean brydon",
    template: "%s — sean brydon",
  },
  description: "developer from newcastle, england. building cal.com.",
  metadataBase: new URL("https://brydon.io"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} ${dyslexicFont.variable} font-mono antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <A11yWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
