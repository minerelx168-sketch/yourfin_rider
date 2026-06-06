import { useState } from 'react';
import * as api from '../api/client';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { Scorecard } from '../components/Scorecard';
import { Modal } from '../components/Modal';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatBaht, formatDateTime, formatNumber } from '../lib/format';
import { WITHDRAWAL_COLOR } from '../lib/status';
import './FinanceOverviewPage.css';

/** Small slip thumbnail that falls back to a link if the image can't load. */
function SlipThumb({ url, onOpen }: { url: string; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <button type="button" className="fin-slip-fallback" onClick={onOpen} title="ดูสลิป">
        🧾 ดูสลิป
      </button>
    );
  }
  return (
    <button type="button" className="fin-slip-btn" onClick={onOpen} title="ดูสลิป">
      <img className="fin-slip-thumb" src={url} alt="สลิป" onError={() => setBroken(true)} />
    </button>
  );
}

export function FinanceOverviewPage() {
  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(() =>
    api.getFinanceSummary(),
  );
  useReportFreshness(lastUpdated);
  const [viewingSlip, setViewingSlip] = useState<string | null>(null);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>ภาพรวมการเงิน</h2>
          <div className="sub">สรุปคำขอถอนและการจ่ายเงินคอมมิชชั่นของไรเดอร์</div>
        </div>
        {refreshing && (
          <span className="refresh-tag">
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            กำลังอัปเดต…
          </span>
        )}
      </div>

      {loading ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : error && !data ? (
        <div className="card">
          <ErrorBlock message={error} onRetry={reload} />
        </div>
      ) : data ? (
        <>
          <div className="fin-scorecards">
            <Scorecard
              label="รอถอน"
              value={formatNumber(data.pending.count)}
              unit="รายการ"
              icon="⏳"
              accent={WITHDRAWAL_COLOR.PENDING}
              sub={formatBaht(data.pending.amount)}
            />
            <Scorecard
              label="รออนุมัติจ่าย"
              value={formatNumber(data.approved.count)}
              unit="รายการ"
              icon="📝"
              accent={WITHDRAWAL_COLOR.APPROVED}
              sub={formatBaht(data.approved.amount)}
            />
            <Scorecard
              label="จ่ายวันนี้"
              value={formatBaht(data.paidToday.amount)}
              icon="💸"
              accent={WITHDRAWAL_COLOR.PAID}
              sub={`${formatNumber(data.paidToday.count)} รายการ`}
            />
            <Scorecard
              label="จ่ายเดือนนี้"
              value={formatBaht(data.paidThisMonth.amount)}
              icon="📅"
              accent="#0891b2"
              sub={`${formatNumber(data.paidThisMonth.count)} รายการ`}
            />
            <Scorecard
              label="ปฏิเสธ"
              value={formatNumber(data.rejected.count)}
              unit="รายการ"
              icon="🚫"
              accent={WITHDRAWAL_COLOR.REJECTED}
              sub={formatBaht(data.rejected.amount)}
            />
          </div>

          <div className="card fin-recent">
            <div className="card-title fin-recent-title">รายการจ่ายล่าสุด</div>
            {data.recentPayouts.length === 0 ? (
              <EmptyBlock message="ยังไม่มีการจ่ายเงิน" icon="🧾" />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>ไรเดอร์</th>
                      <th>ธนาคาร</th>
                      <th className="num">จำนวน</th>
                      <th>เวลาที่จ่าย</th>
                      <th>สลิป</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPayouts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="fin-name">{p.riderName}</div>
                          {p.region && <div className="faint">{p.region}</div>}
                        </td>
                        <td>{p.bankName ?? '—'}</td>
                        <td className="num">
                          <strong>{formatBaht(p.amount)}</strong>
                        </td>
                        <td className="muted">{formatDateTime(p.processedAt)}</td>
                        <td>
                          {p.slipUrl ? (
                            <SlipThumb url={p.slipUrl} onOpen={() => setViewingSlip(p.slipUrl)} />
                          ) : (
                            <span className="faint">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {viewingSlip && (
        <Modal title="สลิปการโอนเงิน" onClose={() => setViewingSlip(null)}>
          <a href={viewingSlip} target="_blank" rel="noreferrer">
            <img className="fin-slip-full" src={viewingSlip} alt="สลิป" />
          </a>
        </Modal>
      )}
    </div>
  );
}
