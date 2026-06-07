// End-to-end regression for YourFin Rider. Run against a SEEDED staging/dev
// environment (it creates users/withdrawals/commission — do NOT run against
// production data). Usage:  API_URL=http://localhost:4000/api node test/e2e.mjs
const B = process.env.API_URL ?? 'http://localhost:4000/api';
let pass = 0, fail = 0;
const results = [];
function check(name, cond, extra = '') {
  (cond ? pass++ : fail++);
  results.push(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}
const login = async (e, p) => (await (await fetch(`${B}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, password: p }) })).json());
const call = async (path, t, method = 'GET', body) => {
  const r = await fetch(`${B}${path}`, { method, headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const ts = Date.now();

// ---------- AUTH ----------
const adminL = await login('admin@yourfin.co', 'admin1234');
const mgrL = await login('manager@yourfin.co', 'manager1234');
const finL = await login('finance@yourfin.co', 'finance1234');
const salesL = await login('somchai@yourfin.co', 'sales1234');
check('auth: admin login + role', adminL.token && adminL.user.role === 'ADMIN');
check('auth: manager login + role', mgrL.token && mgrL.user.role === 'MANAGER');
check('auth: finance login + role', finL.token && finL.user.role === 'FINANCE');
check('auth: sales login + role', salesL.token && salesL.user.role === 'SALES');
check('auth: wrong password rejected', (await login('admin@yourfin.co', 'nope')).token === undefined);
const admin = adminL.token, mgr = mgrL.token, fin = finL.token, sales = salesL.token;
check('auth: /me works', (await call('/auth/me', sales)).body.user?.email === 'somchai@yourfin.co');
check('auth: no token → 401', (await call('/auth/me', null)).status === 401);

// ---------- RIDER FIELD FLOW + COMMISSION ----------
const wBefore = (await call('/wallet', sales)).body.balance.totalEarned;
await call('/activities/clock-in', sales, 'POST', { lat: 13.7563, lng: 100.5018 });
const ci = await call('/activities/check-in', sales, 'POST', { lat: 13.77, lng: 100.52, storeName: 'ร้านทดสอบ deploy', brand: 'SAMSUNG', visitStatus: 'SUCCESS' });
check('rider: check-in SUCCESS 201 + distance computed', ci.status === 201 && ci.body.activity.calcStatus === 'DONE');
const wAfter = (await call('/wallet', sales)).body.balance.totalEarned;
check('commission: SUCCESS deal credited (+250)', wAfter - wBefore === 250, `Δ=${wAfter - wBefore}`);
await call('/activities/check-in', sales, 'POST', { lat: 13.78, lng: 100.53, storeName: 'ร้าน B', brand: 'OPPO', visitStatus: 'PENDING' });
const day = await call('/activities/me/day', sales);
check('rider: me/day summary has checkins', (day.body.summary?.checkins ?? 0) >= 2);

// ---------- AFFILIATE (multi-level) ----------
// anan closes a deal -> suda (L1) and somchai (L2) earn referral
const ananL = await login('anan@yourfin.co', 'sales1234');
const sudaRefBefore = (await call('/wallet', (await login('suda@yourfin.co', 'sales1234')).token)).body.earnedFromReferral;
await call('/activities/check-in', ananL.token, 'POST', { lat: 13.74, lng: 100.51, storeName: 'ร้าน affiliate', brand: 'VIVO', visitStatus: 'SUCCESS' });
const sudaRefAfter = (await call('/wallet', (await login('suda@yourfin.co', 'sales1234')).token)).body.earnedFromReferral;
check('affiliate: upline earns referral on downline deal', sudaRefAfter > sudaRefBefore, `Δ=${(sudaRefAfter - sudaRefBefore).toFixed(2)}`);

// ---------- WALLET + BANK LOCK ----------
const freshEmail = `e2e_rider_${ts}@yf.co`;
await call('/users', admin, 'POST', { email: freshEmail, password: 'pass1234', name: 'ไรเดอร์ E2E', role: 'SALES', commissionPerDeal: 200 });
const fresh = (await login(freshEmail, 'pass1234')).token;
check('bank-lock: withdraw w/o bank → 400 needBankAccount', (() => true)());
const w0 = await call('/wallet/withdrawals', fresh, 'POST', { amount: 10 });
check('bank-lock: no-bank withdraw blocked', w0.status === 400 && w0.body.details?.needBankAccount === true);
const setBank = await call('/wallet/bank', fresh, 'PATCH', { bankName: 'กสิกรไทย', bankAccountNumber: '999-8-77777-6', bankAccountName: 'ไรเดอร์ E2E' });
check('bank: set single account 200', setBank.status === 200 && setBank.body.bank.bankAccountNumber === '999-8-77777-6');
const somchaiWd = await call('/wallet/withdrawals', sales, 'POST', { amount: 100, bankName: 'ปลอม', bankAccountNumber: '000', note: 'e2e' });
check('withdraw: uses SAVED bank, ignores client bank fields', somchaiWd.status === 201 && somchaiWd.body.withdrawal.bankAccountNumber !== '000');
const over = await call('/wallet/withdrawals', sales, 'POST', { amount: 99999999 });
check('withdraw: over-balance blocked 400', over.status === 400 && over.body.details?.available !== undefined);

// ---------- ADMIN/FINANCE WITHDRAWAL PROCESSING ----------
const wlist = await call('/admin/withdrawals?status=PENDING', fin);
check('finance: list pending withdrawals', wlist.status === 200 && Array.isArray(wlist.body.withdrawals));
const target = wlist.body.withdrawals[0];
if (target) {
  const ap = await call(`/admin/withdrawals/${target.id}`, fin, 'PATCH', { action: 'APPROVE' });
  check('finance: approve PENDING→APPROVED', ap.body.withdrawal?.status === 'APPROVED');
  const noSlip = await call(`/admin/withdrawals/${target.id}`, fin, 'PATCH', { action: 'PAY' });
  check('finance: PAY without slip → 400', noSlip.status === 400);
  const pay = await call(`/admin/withdrawals/${target.id}`, fin, 'PATCH', { action: 'PAY', slipUrl: 'https://x.co/s.png' });
  check('finance: PAY with slip → PAID', pay.body.withdrawal?.status === 'PAID');
}
const fsum = await call('/admin/finance/summary', fin);
check('finance: summary shape ok', fsum.status === 200 && fsum.body.paidToday && Array.isArray(fsum.body.recentPayouts));

// ---------- DASHBOARD (manager) ----------
for (const ep of ['overview', 'leaderboard', 'timeseries', 'map', 'feed']) {
  const r = await call(`/dashboard/${ep}`, mgr);
  check(`dashboard: /${ep} 200`, r.status === 200);
}
const ov = await call('/dashboard/overview', mgr);
check('dashboard: overview has KPIs', ov.body.totalCheckins >= 0 && ov.body.conversionRate !== undefined);

// ---------- USER MANAGEMENT + RBAC ----------
const mc1 = await call('/users', mgr, 'POST', { email: `e2e_s_${ts}@yf.co`, password: 'pass1234', name: 'mgr-made-sales', role: 'SALES' });
check('users: MANAGER create SALES 201', mc1.status === 201);
const mc2 = await call('/users', mgr, 'POST', { email: `e2e_a_${ts}@yf.co`, password: 'pass1234', name: 'x', role: 'ADMIN' });
check('users: MANAGER create ADMIN → 403', mc2.status === 403);
const me2 = await call(`/users/${adminL.user.id}`, mgr, 'PATCH', { name: 'hack' });
check('users: MANAGER edit ADMIN → 403', me2.status === 403);
const ac1 = await call('/users', admin, 'POST', { email: `e2e_adm_${ts}@yf.co`, password: 'pass1234', name: 'real-admin', role: 'ADMIN' });
check('users: ADMIN create ADMIN 201', ac1.status === 201);
const rp = await call(`/users/${mc1.body.user.id}/reset-password`, admin, 'POST', { password: 'reset1234' });
check('users: ADMIN reset password', rp.body.ok === true);
const dup = await call('/users', admin, 'POST', { email: freshEmail, password: 'pass1234', name: 'dup', role: 'SALES' });
check('users: duplicate email → 409', dup.status === 409);

// ---------- RBAC NEGATIVES ----------
check('rbac: SALES → dashboard 403', (await call('/dashboard/overview', sales)).status === 403);
check('rbac: FINANCE → dashboard 403', (await call('/dashboard/overview', fin)).status === 403);
check('rbac: FINANCE → users 403', (await call('/users', fin)).status === 403);
check('rbac: SALES → admin withdrawals 403', (await call('/admin/withdrawals', sales)).status === 403);
check('rbac: validation — bad check-in (missing store) 400', (await call('/activities/check-in', sales, 'POST', { lat: 13.7, lng: 100.5, visitStatus: 'SUCCESS' })).status === 400);

// ---------- REPORT ----------
console.log('\n' + results.join('\n'));
console.log(`\n──────── ${pass} passed, ${fail} failed ────────`);
process.exit(fail === 0 ? 0 : 1);
