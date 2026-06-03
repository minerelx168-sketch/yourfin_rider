import * as api from '../api/client';
import { useRange } from '../range/useRange';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { PageHeader } from '../components/PageHeader';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatKm, formatNumber, formatPercent } from '../lib/format';
import type { LeaderboardRow } from '../types';
import './LeaderboardPage.css';

/** Inclusive number of days in the selected range (min 1). */
function rangeDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

export function LeaderboardPage() {
  const { range } = useRange();
  const days = rangeDays(range.from, range.to);

  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(
    () => api.getLeaderboard(range),
    { deps: [range.from, range.to] },
  );
  useReportFreshness(lastUpdated);

  const rows = data?.leaderboard ?? [];

  return (
    <div>
      <PageHeader title="อันดับเซลล์" refreshing={refreshing} />

      <div className="card">
        {loading ? (
          <LoadingBlock />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyBlock />
        ) : (
          <>
            <div className="lb-note muted">
              เป้าหมายคำนวณจาก เป้า/วัน × {days} วัน ในช่วงที่เลือก · แถวที่เน้นสี
              = ทำได้ตามเป้า
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>อันดับ</th>
                    <th>ชื่อ</th>
                    <th>ภูมิภาค</th>
                    <th className="num">เช็คอิน</th>
                    <th className="num">ปิดดีล</th>
                    <th className="num">Conversion</th>
                    <th className="num">ระยะทาง (กม.)</th>
                    <th className="num">เป้า/วัน</th>
                    <th>สถานะเป้า</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <Row key={row.userId} row={row} rank={i + 1} days={days} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  row,
  rank,
  days,
}: {
  row: LeaderboardRow;
  rank: number;
  days: number;
}) {
  const targetTotal = row.targetDailyClose * days;
  const metTarget = targetTotal > 0 && row.success >= targetTotal;
  const pct = targetTotal > 0 ? Math.round((row.success / targetTotal) * 100) : 0;

  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <tr className={metTarget ? 'lb-met' : undefined}>
      <td>
        <span className="lb-rank">
          {medal ?? <span className="rank-num">{rank}</span>}
        </span>
      </td>
      <td>
        <div className="lb-name">{row.name}</div>
        {row.team && <div className="faint lb-team">{row.team}</div>}
      </td>
      <td className="muted">{row.region ?? '-'}</td>
      <td className="num">{formatNumber(row.checkins)}</td>
      <td className="num">
        <strong>{formatNumber(row.success)}</strong>
      </td>
      <td className="num">{formatPercent(row.conversionRate)}</td>
      <td className="num">{formatKm(row.distanceKm)}</td>
      <td className="num">{formatNumber(row.targetDailyClose)}</td>
      <td>
        <div className="lb-target">
          <div className="lb-bar">
            <div
              className={`lb-bar-fill${metTarget ? ' met' : ''}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <span className={`lb-pct${metTarget ? ' met' : ''}`}>{pct}%</span>
        </div>
      </td>
    </tr>
  );
}
