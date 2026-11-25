import type { Metadata, Viewport } from 'next';
import './globals.css';

// 공유 미리보기(OG) 이미지의 절대 주소 기준. 도메인을 정하면 NEXT_PUBLIC_SITE_URL 로 덮어쓴다.
const SITE = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3210');

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: '크리스마스에 운명의 문을 열어 버렸다',
  description: '크리스마스 전, 딱 한 번 열리는 문. 노엘이 여덟 글자로 올해와 12월의 인연을 읽어줘요.',
  openGraph: {
    title: '크리스마스에 운명의 문을 열어 버렸다',
    description: '크리스마스 전, 딱 한 번 열리는 문',
    images: ['/img/noel_m.jpg'],
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#07070b',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=East+Sea+Dokdo&family=Nanum+Myeongjo:wght@400;800&family=Pinyon+Script&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
