import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { TERMS } from '@/content/legal';

export const metadata: Metadata = { title: '이용약관 · 크리스마스에 운명의 문을 열어 버렸다' };

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
