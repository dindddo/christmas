'use client';

import { useEffect, useRef } from 'react';
import { mountAct2, type Act2View } from '@/lib/act2/render';

// 검토 화면: 맨 위 ◀ ▶ 로 편지·각 장·추신을 오간다
export default function Act2App({ view, note }: { view: Act2View; note?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? mountAct2(ref.current, view, { review: true, note }) : undefined), [view, note]);
  return <div className="stage" id="stage" ref={ref} />;
}
