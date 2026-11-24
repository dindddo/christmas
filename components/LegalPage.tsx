import Link from 'next/link';
import { bizLines, LEGAL_LINKS, type LegalDoc } from '@/content/legal';

// 약관·개인정보처리방침·환불정책 공용 화면. 문구는 content/legal.ts 에서 고친다.
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="legal">
      <Link href="/" className="legal-back">← 처음으로</Link>
      <h1>{doc.title}</h1>
      <p className="legal-lead">{doc.lead}</p>
      {doc.sections.map(s => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p?.map((t, i) => <p key={i}>{t}</p>)}
          {s.li && <ul>{s.li.map((t, i) => <li key={i}>{t}</li>)}</ul>}
          {s.table && (
            <div className="legal-table">
              <table>
                <thead><tr>{s.table[0].map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{s.table.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <footer className="biz">
        <nav>{LEGAL_LINKS.map(l => <Link key={l.href} href={l.href} className={l.strong ? 'strong' : ''}>{l.label}</Link>)}</nav>
        {bizLines().map(t => <p key={t}>{t}</p>)}
      </footer>
    </main>
  );
}
