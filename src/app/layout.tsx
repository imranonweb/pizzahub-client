import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Figtree,
  Geist_Mono,
  Hind_Siliguri,
} from "next/font/google";
import { CartProvider } from "@/components/providers/cart-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { getApiBaseUrl } from "@/lib/api-client";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "PizzaHub — Artisan Brick-Oven Pizza Ordering & Delivery",
  description:
    "Discover verified wood-fired pizzerias across Dhaka, Chattogram, and Sylhet, explore menus in English or Bangla, and order fresh pizza with Cash on Delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const apiOrigin = getApiBaseUrl();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolageGrotesque.variable} ${figtree.variable} ${hindSiliguri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={apiOrigin} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <SessionProvider>
              <Toaster>
                <CartProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </CartProvider>
              </Toaster>
            </SessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
