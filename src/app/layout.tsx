import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./ConvexClientProvider";
import PWARegister from "@/components/PWARegister";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Vitour - Your Food Tour Recap",
  description: "Share your food journey with style. Create beautiful recaps of your food tours and share them with your friends.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vitour",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} bg-background text-foreground scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased selection:bg-primary/30 min-h-screen">
        <ClerkProvider>
          <ConvexClientProvider>
            {children}
            <PWARegister />
            <InstallBanner />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

