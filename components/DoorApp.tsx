'use client';

import { useEffect, useRef } from 'react';
import { mountFlow } from '@/lib/flow/flow';

// 개발 모드: 테스트 기본값(태준/1989.3.18)·"건너뛰기" 버튼 노출. 운영 빌드에서는 자동으로 빠진다.
const DEV = process.env.NODE_ENV !== 'production';

export default function DoorApp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    // 디자인 비교안: ?look=b (개발 모드에서만)
    if (DEV) document.documentElement.dataset.look = new URLSearchParams(location.search).get('look') || '';
    return mountFlow(ref.current, { dev: DEV });
  }, []);
  return <div className="stage" id="stage" ref={ref} />;
}
