import { useCallback, useRef, useState } from 'react';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { Scorecard } from '../components/Scorecard';
import { Modal } from '../components/Modal';
import { WithdrawalStatusBadge } from '../components/WithdrawalStatusBadge';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatBaht, formatDateTime, formatNumber } from '../lib/format';
import { WITHDRAWAL_COLOR } from '../lib/status';
import type { Withdrawal, WithdrawalStatus } from '../types';
import './WithdrawalsPage.css';

const FILTERS: { value: WithdrawalStatus | ''; label: string }[] = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'PAID', label: 'จ่ายแล้ว' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
];

export function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | ''>('');

  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(
    () =>
      api.getAdminWithdrawals(
        statusFilter ? { status: statusFilter } : undefined,
      ),
    { deps: [statusFilter] },
  );
  useReportFreshness(lastUpdated);

  // Row being processed via the "จ่ายเงิน" modal.
  const [payTarget, setPayTarget] = useState<Withdrawal | null>(null);
  // Slip image being viewed full-size.
  const [viewingSlip, setViewingSlip] = useState<string | null>(null);
  // Per-row inline action (approve/reject) state.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const rows = data?.withdrawals ?? [];
  const summary = data?.summary;

  const handleInlineAction = useCallback(
    async (w: Withdrawal, action: 'APPROVE' | 'REJECT') => {
      if (action === 'REJECT') {
        const ok = window.confirm(
          `ยืนยันปฏิเสธคำขอถอนของ ${w.user?.name ?? 'ไรเดอร์'} จำนวน ${formatBaht(
            w.amount,
          )}?`,
        );
        if (!ok) return;
      }
      setBusyId(w.id);
      setRowError(null);
      try {
        await api.processWithdrawal(w.id, { action });
        reload();
      } catch (err) {
        setRowError(
          err instanceof ApiError ? err.message : 'ดำเนินการไม่สำเร็จ',
        );
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>ถอนคอมมิชชั่น</h2>
          <div className="sub">จัดการคำขอถอนเงินคอมมิชชั่นของไรเดอร์</div>
        </div>
        {refreshing && (
          <span className="refresh-tag">
            <span
              className="spinner"
              style={{ width: 14, height: 14, borderWidth: 2 }}
            />
            กำลังอัปเดต…
          </span>
        )}
      </div>

      <div className="scorecards wd-scorecards">
        <Scorecard
          label="รออนุมัติ"
          value={formatNumber(summary?.pending.count ?? 0)}
          unit="รายการ"
          icon="⏳"
          accent={WITHDRAWAL_COLOR.PENDING}
          sub={formatBaht(summary?.pending.amount ?? 0)}
        />
        <Scorecard
          label="อนุมัติแล้ว"
          value={formatNumber(summary?.approved.count ?? 0)}
          unit="รายการ"
          icon="📝"
          accent={WITHDRAWAL_COLOR.APPROVED}
          sub={formatBaht(summary?.approved.amount ?? 0)}
        />
        <Scorecard
          label="จ่ายแล้ว"
          value={formatNumber(summary?.paid.count ?? 0)}
          unit="รายการ"
          icon="✅"
          accent={WITHDRAWAL_COLOR.PAID}
          sub={formatBaht(summary?.paid.amount ?? 0)}
        />
        <Scorecard
          label="ปฏิเสธ"
          value={formatNumber(summary?.rejected.count ?? 0)}
          unit="รายการ"
          icon="🚫"
          accent={WITHDRAWAL_COLOR.REJECTED}
          sub={formatBaht(summary?.rejected.amount ?? 0)}
        />
      </div>

      <div className="wd-toolbar">
        <div className="wd-filters">
          {FILTERS.map((f) => (
            <button
              key={f.value || 'ALL'}
              className={`preset${statusFilter === f.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rowError && (
        <div className="wd-row-error">⚠️ {rowError}</div>
      )}

      <div className="card">
        {loading ? (
          <LoadingBlock />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyBlock message="ไม่มีคำขอถอนตามเงื่อนไขที่เลือก" icon="💸" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ผู้ขอถอน</th>
                  <th className="num">จำนวนเงิน</th>
                  <th>ธนาคาร / บัญชี</th>
                  <th>สถานะ</th>
                  <th>วันที่ขอ</th>
                  <th>สลิป</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <Row
                    key={w.id}
                    w={w}
                    busy={busyId === w.id}
                    anyBusy={busyId !== null}
                    onApprove={() => handleInlineAction(w, 'APPROVE')}
                    onReject={() => handleInlineAction(w, 'REJECT')}
                    onPay={() => {
                      setRowError(null);
                      setPayTarget(w);
                    }}
                    onViewSlip={setViewingSlip}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payTarget && (
        <PayModal
          withdrawal={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={() => {
            setPayTarget(null);
            reload();
          }}
        />
      )}

      {viewingSlip && (
        <Modal title="สลิปการโอนเงิน" onClose={() => setViewingSlip(null)}>
          <a href={viewingSlip} target="_blank" rel="noreferrer">
            <img className="wd-slip-full" src={viewingSlip} alt="สลิป" />
          </a>
        </Modal>
      )}
    </div>
  );
}

function Row({
  w,
  busy,
  anyBusy,
  onApprove,
  onReject,
  onPay,
  onViewSlip,
}: {
  w: Withdrawal;
  busy: boolean;
  anyBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPay: () => void;
  onViewSlip: (url: string) => void;
}) {
  const disabled = anyBusy;
  const canApprove = w.status === 'PENDING';
  const canReject = w.status === 'PENDING' || w.status === 'APPROVED';
  const canPay = w.status === 'PENDING' || w.status === 'APPROVED';

  return (
    <tr>
      <td>
        <div className="wd-name">{w.user?.name ?? '—'}</div>
        {w.user?.region && <div className="faint wd-region">{w.user.region}</div>}
      </td>
      <td className="num">
        <strong>{formatBaht(w.amount)}</strong>
      </td>
      <td>
        <div className="wd-bank">{w.bankName ?? '—'}</div>
        <div className="faint wd-acct">{w.bankAccountNumber ?? '—'}</div>
        {w.bankAccountName && (
          <div className="muted wd-acct">{w.bankAccountName}</div>
        )}
      </td>
      <td>
        <WithdrawalStatusBadge status={w.status} />
      </td>
      <td className="muted wd-date">{formatDateTime(w.requestedAt)}</td>
      <td>
        {w.slipUrl ? (
          <button
            type="button"
            className="wd-slip-thumb-btn"
            onClick={() => onViewSlip(w.slipUrl as string)}
            title="ดูสลิป"
          >
            <img className="wd-slip-thumb" src={w.slipUrl} alt="สลิป" />
          </button>
        ) : (
          <span className="faint">—</span>
        )}
      </td>
      <td>
        {busy ? (
          <span className="refresh-tag">
            <span
              className="spinner"
              style={{ width: 14, height: 14, borderWidth: 2 }}
            />
            กำลังดำเนินการ…
          </span>
        ) : canApprove || canReject || canPay ? (
          <div className="wd-actions">
            {canApprove && (
              <button
                className="btn wd-btn-approve"
                onClick={onApprove}
                disabled={disabled}
              >
                อนุมัติ
              </button>
            )}
            {canPay && (
              <button
                className="btn btn-primary wd-btn-sm"
                onClick={onPay}
                disabled={disabled}
              >
                จ่ายเงิน
              </button>
            )}
            {canReject && (
              <button
                className="btn wd-btn-reject"
                onClick={onReject}
                disabled={disabled}
              >
                ปฏิเสธ
              </button>
            )}
          </div>
        ) : (
          <span className="faint">—</span>
        )}
      </td>
    </tr>
  );
}

function PayModal({
  withdrawal,
  onClose,
  onPaid,
}: {
  withdrawal: Withdrawal;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = uploading || saving;

  function pickFile(f: File | null) {
    setErrorMsg(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    if (!file) {
      setErrorMsg('กรุณาแนบรูปสลิปก่อนจ่ายเงิน');
      return;
    }
    setErrorMsg(null);
    try {
      setUploading(true);
      const { url } = await api.uploadSlip(file);
      setUploading(false);

      setSaving(true);
      await api.processWithdrawal(withdrawal.id, {
        action: 'PAY',
        slipUrl: url,
        adminNote: adminNote.trim() || undefined,
      });
      onPaid();
    } catch (err) {
      setUploading(false);
      setSaving(false);
      setErrorMsg(
        err instanceof ApiError ? err.message : 'จ่ายเงินไม่สำเร็จ กรุณาลองใหม่',
      );
    }
  }

  return (
    <Modal
      title="จ่ายเงินคำขอถอน"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>
            ยกเลิก
          </button>
          <button
            className="btn wd-btn-pay-confirm"
            onClick={handleSubmit}
            disabled={busy || !file}
          >
            {uploading
              ? 'กำลังอัปโหลด…'
              : saving
                ? 'กำลังบันทึก…'
                : 'ยืนยันจ่ายเงิน'}
          </button>
        </>
      }
    >
      <div className="modal-form">
        <div className="wd-pay-summary">
          <div>
            <span className="muted">ผู้ขอถอน</span>
            <strong>{withdrawal.user?.name ?? '—'}</strong>
          </div>
          <div>
            <span className="muted">จำนวนเงิน</span>
            <strong>{formatBaht(withdrawal.amount)}</strong>
          </div>
          <div>
            <span className="muted">ธนาคาร</span>
            <strong>{withdrawal.bankName ?? '—'}</strong>
          </div>
          <div>
            <span className="muted">เลขบัญชี</span>
            <strong>{withdrawal.bankAccountNumber ?? '—'}</strong>
          </div>
          {withdrawal.bankAccountName && (
            <div>
              <span className="muted">ชื่อบัญชี</span>
              <strong>{withdrawal.bankAccountName}</strong>
            </div>
          )}
        </div>

        {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}

        <div className="field">
          <label>แนบสลิปการโอนเงิน (จำเป็น)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="input wd-file-input"
            disabled={busy}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl && (
            <div className="wd-preview">
              <img src={previewUrl} alt="ตัวอย่างสลิป" />
              {!busy && (
                <button
                  type="button"
                  className="btn btn-ghost wd-preview-clear"
                  onClick={() => {
                    pickFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  ลบรูป
                </button>
              )}
            </div>
          )}
        </div>

        <div className="field">
          <label>หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            className="input wd-textarea"
            rows={2}
            value={adminNote}
            disabled={busy}
            placeholder="เช่น เลขอ้างอิงการโอน"
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
