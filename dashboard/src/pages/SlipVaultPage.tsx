import { useMemo, useState } from 'react';
import * as api from '../api/client';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { Modal } from '../components/Modal';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatBaht, formatDateTime } from '../lib/format';
import type { Withdrawal } from '../types';
import './SlipVaultPage.css';

type SortKey = 'date' | 'amount';

export function SlipVaultPage() {
  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(() =>
    api.getAdminWithdrawals({ status: 'PAID' }),
  );
  useReportFreshness(lastUpdated);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [viewing, setViewing] = useState<Withdrawal | null>(null);

  const slips = useMemo(() => {
    let list = (data?.withdrawals ?? []).filter((w) => w.slipUrl);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((w) => (w.user?.name ?? '').toLowerCase().includes(term));
    }
    const at = (w: Withdrawal) => new Date(w.processedAt ?? w.requestedAt).getTime();
    return [...list].sort((a, b) => (sort === 'amount' ? b.amount - a.amount : at(b) - at(a)));
  }, [data, q, sort]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>คลังสลิป</h2>
          <div className="sub">
            {slips.length > 0
              ? `จัดเก็บสลิปการโอนทั้งหมด ${slips.length} รายการ`
              : 'จัดเก็บสลิปการโอนเงินคอมมิชชั่น'}
          </div>
        </div>
        {refreshing && (
          <span className="refresh-tag">
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            กำลังอัปเดต…
          </span>
        )}
      </div>

      <div className="vault-toolbar">
        <input
          className="input vault-search"
          placeholder="ค้นหาชื่อไรเดอร์…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="vault-sort">
          <button
            className={`vault-sort-btn${sort === 'date' ? ' active' : ''}`}
            onClick={() => setSort('date')}
          >
            ล่าสุด
          </button>
          <button
            className={`vault-sort-btn${sort === 'amount' ? ' active' : ''}`}
            onClick={() => setSort('amount')}
          >
            จำนวนเงิน
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : error && !data ? (
        <div className="card">
          <ErrorBlock message={error} onRetry={reload} />
        </div>
      ) : slips.length === 0 ? (
        <div className="card">
          <EmptyBlock message="ยังไม่มีสลิป" icon="🧾" />
        </div>
      ) : (
        <div className="vault-grid">
          {slips.map((w) => (
            <SlipCard key={w.id} w={w} onOpen={() => setViewing(w)} />
          ))}
        </div>
      )}

      {viewing && (
        <Modal title={`สลิป — ${viewing.user?.name ?? ''}`} onClose={() => setViewing(null)}>
          <div className="vault-detail">
            <a href={viewing.slipUrl ?? '#'} target="_blank" rel="noreferrer">
              <img className="vault-full" src={viewing.slipUrl ?? ''} alt="สลิป" />
            </a>
            <div className="vault-detail-meta">
              <div>
                <span className="muted">ไรเดอร์</span>
                <strong>{viewing.user?.name ?? '—'}</strong>
              </div>
              <div>
                <span className="muted">จำนวน</span>
                <strong>{formatBaht(viewing.amount)}</strong>
              </div>
              <div>
                <span className="muted">ธนาคาร</span>
                <strong>{viewing.bankName ?? '—'}</strong>
              </div>
              <div>
                <span className="muted">เลขบัญชี</span>
                <strong>{viewing.bankAccountNumber ?? '—'}</strong>
              </div>
              <div>
                <span className="muted">วันที่จ่าย</span>
                <strong>{formatDateTime(viewing.processedAt ?? viewing.requestedAt)}</strong>
              </div>
            </div>
            {viewing.slipUrl && (
              <a className="btn btn-ghost" href={viewing.slipUrl} target="_blank" rel="noreferrer">
                เปิดรูปต้นฉบับ
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function SlipCard({ w, onOpen }: { w: Withdrawal; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <button type="button" className="slip-card card" onClick={onOpen}>
      <div className="slip-card-img">
        {broken || !w.slipUrl ? (
          <div className="slip-broken">
            🧾<span>ดูสลิป</span>
          </div>
        ) : (
          <img src={w.slipUrl} alt="สลิป" onError={() => setBroken(true)} />
        )}
      </div>
      <div className="slip-card-meta">
        <div className="slip-card-name">{w.user?.name ?? '—'}</div>
        <div className="slip-card-row">
          <span className="muted">{w.bankName ?? '—'}</span>
          <strong className="slip-card-amt">{formatBaht(w.amount)}</strong>
        </div>
        <div className="faint slip-card-date">
          {formatDateTime(w.processedAt ?? w.requestedAt)}
        </div>
      </div>
    </button>
  );
}
