import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gettrellis.app"),
  title: "Trellis",
  description: "AI-assisted professional development for educators",
  openGraph: {
    title: "Trellis",
    description: "AI-assisted professional development for educators",
    url: "https://gettrellis.app",
    siteName: "gettrellis.app",
    images: [
      {
        url: "/trellis-card.png",
        width: 1200,
        height: 630,
        alt: "Trellis – AI-assisted professional development for educators",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trellis",
    description: "AI-assisted professional development for educators",
    images: ["/trellis-card.png"],
  },
  icons: {
    icon: "/trellis-light.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${plexMono.variable} antialiased min-h-screen bg-white`}>{children}</body>
    </html>
  );
}
