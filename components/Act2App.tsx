'use client';

import { useEffect, useRef } from 'react';
import { mountAct2, type Act2View } from '@/lib/act2/render';

export default function Act2App({ view }: { view: Act2View }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? mountAct2(ref.current, view) : undefined), [view]);
  return <div className="stage" id="stage" ref={ref} />;
}
