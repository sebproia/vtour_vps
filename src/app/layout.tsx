import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
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
  colorScheme: "light",
  themeColor: "#f24099",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Vitour — Tes balades gourmandes",
  description: "Organise tes food tours, partage tes bonnes adresses et retrouve tes souvenirs de dégustation.",
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
        <ClerkProvider appearance={{ theme: shadcn }}>
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

