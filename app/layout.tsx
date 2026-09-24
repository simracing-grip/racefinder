import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TAGLINE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-800 bg-gray-950 py-6 text-center text-sm text-gray-500">
          <p>{SITE_NAME} — free directory of sim racing, track day, and karting venues.</p>
          <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/about" className="hover:text-gray-300">
              About
            </Link>
            <Link href="/contact" className="hover:text-gray-300">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-300">
              Terms
            </Link>
            <Link href="/faq" className="hover:text-gray-300">
              FAQ
            </Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
