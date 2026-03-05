import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Archivo_Black, Space_Grotesk, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MKE Budget Compass",
  description:
    "AI-powered civic intelligence for Milwaukee's $1.4B budget",
  openGraph: {
    title: "MKE Budget Compass",
    description:
      "Ask, visualize, listen to, and remix Milwaukee's city budget",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
