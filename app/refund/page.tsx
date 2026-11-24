import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { REFUND } from '@/content/legal';

export const metadata: Metadata = { title: '환불정책 · 크리스마스에 운명의 문을 열어 버렸다' };

export default function Page() {
  return <LegalPage doc={REFUND} />;
}
