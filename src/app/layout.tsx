import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Kazuho Utsunomiya | Portfolio";
const description =
  "Kazuho Utsunomiya / Web Developer。Laravel・Next.jsを中心に、予約・ネットショップ・業務システムを開発。新規開発から既存システムの改善・作り替えまで。";
const url = "https://onewalk.dev/";
const shareImage = {
  url: "https://onewalk.dev/og-image.png",
  width: 1200,
  height: 630,
  alt: "Kazuho Utsunomiya — Web Developer / Webシステムの開発・改善 / onewalk.dev",
};

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Kazuho Utsunomiya",
    url,
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
  robots: { index: true, follow: true },
};

// Trusted static identity only; never include terminal input or request data here.
const personJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kazuho Utsunomiya",
  jobTitle: "Web Developer",
  url,
  sameAs: ["https://github.com/OneWalkDev"],
}).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/* React 18 escapes script children as HTML entities; JSON-LD needs raw JSON. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd }}
        />
      </body>
    </html>
  );
}
