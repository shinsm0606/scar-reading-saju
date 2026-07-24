import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "흉터까지 읽는 사주",
    description: "전통 명리학 요소를 활용한 직설적인 자기 성찰용 사주 경고 보고서",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "흉터까지 읽는 사주",
      description: "좋은 말만 듣고 싶다면, 시작하지 마세요.",
      type: "website",
      images: [{ url: new URL("/og.png", base).toString(), width: 1536, height: 1024, alt: "흉터까지 읽는 사주" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "흉터까지 읽는 사주",
      description: "좋은 말만 듣고 싶다면, 시작하지 마세요.",
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
