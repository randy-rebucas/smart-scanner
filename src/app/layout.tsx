import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "DocScan AI — Smart Scanner",
    template: "%s | DocScan AI",
  },
  description: "Extract structured data from any document image using OCR and AI. Save, search and export scanned documents.",
  keywords: ["document scanner", "OCR", "AI", "document analysis", "invoice parser", "receipt scanner"],
  authors: [{ name: "DocScan AI", url: siteUrl }],
  openGraph: {
    title: "DocScan AI — Smart Scanner",
    description:
      "Extract structured data from any document image using OCR and AI. Save, search and export scanned documents.",
    url: siteUrl,
    siteName: "DocScan AI",
    images: ["/file.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocScan AI — Smart Scanner",
    description: "Extract structured data from any document image using OCR and AI.",
    images: ["/file.svg"],
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <AuthProvider>
            {children}
            {/* JSON-LD Organization structured data for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name: "DocScan AI",
                  url: siteUrl,
                  logo: `${siteUrl}/file.svg`,
                }),
              }}
            />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
