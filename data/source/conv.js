const LUNAR = require('./table.json');
function lunar2solar(y, m, d, leap) {
  const r = LUNAR.find(x => x[0] === y); if (!r) return null;
  const [, start, lm, bits] = r;
  if (leap && lm !== m) return null;
  const idx = m - 1 + (lm && (m > lm || (m === lm && leap)) ? 1 : 0);
  let day = start; for (let i = 0; i < idx; i++) day += 29 + ((bits >> i) & 1);
  const len = 29 + ((bits >> idx) & 1); if (d > len) return null;
  const t = new Date((day + d - 1) * 86400000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
module.exports = lunar2solar;
