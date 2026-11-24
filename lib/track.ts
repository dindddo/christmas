/* eslint-disable @typescript-eslint/no-explicit-any */
// 퍼널 이벤트. GA4(gtag)·Meta 픽셀(fbq)이 붙어 있으면 보내고, 없으면 개발 콘솔에만 찍는다.
// 단계: start → prologue_done|prologue_skip → chat_answer → input_complete → act1_view → cta_view → pay_click → (purchase) / share_click
export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  try {
    w.gtag?.('event', name, params);
    if (name === 'pay_click') w.fbq?.('track', 'InitiateCheckout', params);
    else if (name === 'input_complete') w.fbq?.('track', 'Lead');
    else w.fbq?.('trackCustom', name, params);
  } catch { /* 추적 실패는 무시 */ }
  if (process.env.NODE_ENV !== 'production') console.debug('[track]', name, params);
}
