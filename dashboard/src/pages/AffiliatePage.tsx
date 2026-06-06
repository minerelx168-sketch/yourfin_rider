import { useMemo, useState } from 'react';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { Modal } from '../components/Modal';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatBaht, formatPercent } from '../lib/format';
import type { User } from '../types';
import './AffiliatePage.css';

export function AffiliatePage() {
  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(
    () => api.getUsers(),
    {},
  );
  useReportFreshness(lastUpdated);

  const [editing, setEditing] = useState<User | null>(null);

  const allUsers = useMemo(() => data?.users ?? [], [data]);
  // Riders shown in the table are the SALES role; uplines can be anyone.
  const riders = useMemo(
    () => allUsers.filter((u) => u.role === 'SALES'),
    [allUsers],
  );
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of allUsers) m.set(u.id, u.name);
    return m;
  }, [allUsers]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>ตั้งค่าคอม / Affiliate</h2>
          <div className="sub">
            กำหนดค่าคอมต่อดีล เปอร์เซ็นต์ค่าแนะนำ และสายผู้แนะนำของไรเดอร์
          </div>
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

      <div className="card">
        {loading ? (
          <LoadingBlock />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : riders.length === 0 ? (
          <EmptyBlock message="ยังไม่มีไรเดอร์ (เซลล์) ในระบบ" icon="🏍️" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th className="num">คอมต่อดีล</th>
                  <th className="num">ค่าแนะนำ</th>
                  <th>ผู้แนะนำ</th>
                  <th>ธนาคาร / บัญชี</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="aff-name">{u.name}</div>
                      {u.region && <div className="faint aff-sub">{u.region}</div>}
                    </td>
                    <td className="num">{formatBaht(u.commissionPerDeal)}</td>
                    <td className="num">{formatPercent(u.referralPercent)}</td>
                    <td>
                      {u.referredById ? (
                        <span>{nameById.get(u.referredById) ?? '—'}</span>
                      ) : (
                        <span className="faint">— ไม่มี —</span>
                      )}
                    </td>
                    <td>
                      <div className="aff-bank">{u.bankName ?? '—'}</div>
                      {u.bankAccountNumber && (
                        <div className="faint aff-sub">{u.bankAccountNumber}</div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn aff-edit"
                        onClick={() => setEditing(u)}
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          user={editing}
          allUsers={allUsers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  user,
  allUsers,
  onClose,
  onSaved,
}: {
  user: User;
  allUsers: User[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [commissionPerDeal, setCommissionPerDeal] = useState(
    String(user.commissionPerDeal ?? 0),
  );
  const [referralPercent, setReferralPercent] = useState(
    String(user.referralPercent ?? 0),
  );
  const [referredById, setReferredById] = useState<string>(
    user.referredById ?? '',
  );
  const [bankName, setBankName] = useState(user.bankName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    user.bankAccountNumber ?? '',
  );
  const [bankAccountName, setBankAccountName] = useState(
    user.bankAccountName ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Possible uplines = everyone except the rider themselves.
  const uplineOptions = allUsers.filter((u) => u.id !== user.id);

  async function handleSave() {
    setErrorMsg(null);
    const cpd = Number(commissionPerDeal);
    const rp = Number(referralPercent);
    if (Number.isNaN(cpd) || cpd < 0) {
      setErrorMsg('ค่าคอมต่อดีลต้องเป็นตัวเลขที่ไม่ติดลบ');
      return;
    }
    if (Number.isNaN(rp) || rp < 0 || rp > 100) {
      setErrorMsg('เปอร์เซ็นต์ค่าแนะนำต้องอยู่ระหว่าง 0 ถึง 100');
      return;
    }
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        commissionPerDeal: cpd,
        referralPercent: rp,
        referredById: referredById || null,
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankAccountName: bankAccountName.trim() || null,
      });
      onSaved();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่',
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`แก้ไขค่าคอม — ${user.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button
            className="btn aff-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </>
      }
    >
      <div className="modal-form">
        {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}

        <div className="field">
          <label>ชื่อ</label>
          <input className="input" value={user.name} readOnly disabled />
        </div>

        <div className="field-row">
          <div className="field">
            <label>ค่าคอมต่อดีล (บาท)</label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              value={commissionPerDeal}
              disabled={saving}
              onChange={(e) => setCommissionPerDeal(e.target.value)}
            />
          </div>
          <div className="field">
            <label>ค่าแนะนำ (%)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={referralPercent}
              disabled={saving}
              onChange={(e) => setReferralPercent(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>ผู้แนะนำ (upline)</label>
          <select
            className="input"
            value={referredById}
            disabled={saving}
            onChange={(e) => setReferredById(e.target.value)}
          >
            <option value="">— ไม่มี —</option>
            {uplineOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.region ? ` (${u.region})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>ธนาคาร</label>
          <input
            className="input"
            value={bankName}
            disabled={saving}
            placeholder="เช่น กสิกรไทย"
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>เลขบัญชี</label>
            <input
              className="input"
              value={bankAccountNumber}
              disabled={saving}
              onChange={(e) => setBankAccountNumber(e.target.value)}
            />
          </div>
          <div className="field">
            <label>ชื่อบัญชี</label>
            <input
              className="input"
              value={bankAccountName}
              disabled={saving}
              onChange={(e) => setBankAccountName(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
