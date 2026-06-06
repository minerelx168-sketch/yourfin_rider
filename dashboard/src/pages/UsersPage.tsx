import { useMemo, useState } from 'react';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { Modal } from '../components/Modal';
import { RoleBadge } from '../components/RoleBadge';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { formatDateTime, ROLE_LABEL } from '../lib/format';
import type { CreateUserBody, Role, User, UserUpdate } from '../types';
import './UsersPage.css';

// Order roles are displayed in (chips, dropdowns, filter).
const ALL_ROLES: Role[] = ['SALES', 'FINANCE', 'MANAGER', 'ADMIN'];

type RoleFilter = Role | 'ALL';

/**
 * User management (ออก/จัดการบัญชี). ADMIN + MANAGER only.
 *
 * Mirrors the backend rule: a MANAGER may create/edit/reset/assign every role
 * EXCEPT ADMIN — so for managers we hide ADMIN from role dropdowns and disable
 * every action on rows whose user is an ADMIN. ADMINs see everything.
 */
export function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'ADMIN';
  // Roles this user is allowed to assign (managers can't touch ADMIN).
  const assignableRoles = useMemo(
    () => (isAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => r !== 'ADMIN')),
    [isAdmin],
  );

  const { data, loading, refreshing, error, reload, lastUpdated } =
    usePolledData(() => api.getUsers(), {});
  useReportFreshness(lastUpdated);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  // Per-row busy id + error for the inline active/inactive toggle.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const allUsers = useMemo(() => data?.users ?? [], [data]);

  const counts = useMemo(() => {
    const m: Record<Role, number> = { SALES: 0, FINANCE: 0, MANAGER: 0, ADMIN: 0 };
    for (const u of allUsers) m[u.role] += 1;
    return m;
  }, [allUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (q) {
        const hay = `${u.name} ${u.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, roleFilter, search]);

  // A manager may not act on ADMIN accounts (backend returns 403).
  const canManage = (u: User) => isAdmin || u.role !== 'ADMIN';

  async function handleToggleActive(u: User) {
    const ok = window.confirm(
      u.active
        ? `ยืนยันปิดการใช้งานบัญชีของ ${u.name}?`
        : `เปิดการใช้งานบัญชีของ ${u.name}?`,
    );
    if (!ok) return;
    setBusyId(u.id);
    setRowError(null);
    try {
      await api.updateUser(u.id, { active: !u.active });
      reload();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>ผู้ใช้งาน</h2>
          <div className="sub">ออกและจัดการบัญชีผู้ใช้แต่ละระดับสิทธิ์</div>
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

      <div className="user-chips">
        {ALL_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className={`user-chip${roleFilter === r ? ' active' : ''}`}
            onClick={() => setRoleFilter((prev) => (prev === r ? 'ALL' : r))}
          >
            <RoleBadge role={r} />
            <strong>{counts[r]}</strong>
          </button>
        ))}
      </div>

      <div className="user-toolbar">
        <div className="user-filters">
          <button
            type="button"
            className={`preset${roleFilter === 'ALL' ? ' active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            ทั้งหมด
          </button>
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`preset${roleFilter === r ? ' active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="user-toolbar-right">
          <input
            className="input user-search"
            type="search"
            placeholder="ค้นหาชื่อ หรืออีเมล…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              setRowError(null);
              setCreating(true);
            }}
          >
            + เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {rowError && <div className="user-row-error">⚠️ {rowError}</div>}

      <div className="card">
        {loading ? (
          <LoadingBlock />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyBlock message="ไม่พบผู้ใช้ตามเงื่อนไขที่เลือก" icon="👤" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>อีเมล</th>
                  <th>สิทธิ์</th>
                  <th>ภาค</th>
                  <th>สถานะ</th>
                  <th>วันที่สร้าง</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const manage = canManage(u);
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-name">
                          {u.name}
                          {isMe && <span className="user-me-tag">คุณ</span>}
                        </div>
                        {u.team && <div className="faint user-sub">{u.team}</div>}
                      </td>
                      <td className="user-email">{u.email}</td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td>{u.region || <span className="faint">—</span>}</td>
                      <td>
                        <span
                          className={`badge user-status ${
                            u.active ? 'on' : 'off'
                          }`}
                        >
                          {u.active ? 'ใช้งาน' : 'ปิด'}
                        </span>
                      </td>
                      <td className="muted user-date">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td>
                        {busyId === u.id ? (
                          <span className="refresh-tag">
                            <span
                              className="spinner"
                              style={{ width: 14, height: 14, borderWidth: 2 }}
                            />
                            กำลังดำเนินการ…
                          </span>
                        ) : manage ? (
                          <div className="user-actions">
                            <button
                              className="btn user-btn-edit"
                              onClick={() => {
                                setRowError(null);
                                setEditing(u);
                              }}
                              disabled={busyId !== null}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="btn user-btn-reset"
                              onClick={() => {
                                setRowError(null);
                                setResetting(u);
                              }}
                              disabled={busyId !== null}
                            >
                              รีเซ็ตรหัสผ่าน
                            </button>
                            <button
                              className={`btn ${
                                u.active ? 'user-btn-off' : 'user-btn-on'
                              }`}
                              onClick={() => handleToggleActive(u)}
                              disabled={busyId !== null}
                            >
                              {u.active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                            </button>
                          </div>
                        ) : (
                          <span
                            className="faint user-locked"
                            title="เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการบัญชี ADMIN ได้"
                          >
                            🔒 —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <CreateModal
          assignableRoles={assignableRoles}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            reload();
          }}
        />
      )}

      {editing && (
        <EditModal
          user={editing}
          assignableRoles={assignableRoles}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => setResetting(null)}
        />
      )}
    </div>
  );
}

// ---- Create modal ----

function CreateModal({
  assignableRoles,
  onClose,
  onCreated,
}: {
  assignableRoles: Role[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(assignableRoles[0] ?? 'SALES');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [team, setTeam] = useState('');
  const [targetDailyClose, setTargetDailyClose] = useState('4');
  const [commissionPerDeal, setCommissionPerDeal] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMsg(null);
    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMsg('กรุณากรอกอีเมล รหัสผ่าน และชื่อ');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    const body: CreateUserBody = {
      email: email.trim(),
      password,
      name: name.trim(),
      role,
      phone: phone.trim() || null,
      region: region.trim() || null,
      team: team.trim() || null,
    };
    if (role === 'SALES') {
      const tdc = Number(targetDailyClose);
      if (!Number.isNaN(tdc) && tdc >= 0) body.targetDailyClose = tdc;
      const cpd = Number(commissionPerDeal);
      if (commissionPerDeal.trim() && !Number.isNaN(cpd) && cpd >= 0) {
        body.commissionPerDeal = cpd;
      }
    }
    setSaving(true);
    try {
      await api.createUser(body);
      onCreated();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'สร้างผู้ใช้ไม่สำเร็จ กรุณาลองใหม่',
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      title="เพิ่มผู้ใช้"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'กำลังสร้าง…' : 'สร้างบัญชี'}
          </button>
        </>
      }
    >
      <div className="modal-form">
        {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}

        <div className="field-row">
          <div className="field">
            <label>อีเมล</label>
            <input
              className="input"
              type="email"
              value={email}
              disabled={saving}
              placeholder="name@yourfin.co"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>รหัสผ่าน (เริ่มต้น)</label>
            <input
              className="input"
              type="text"
              value={password}
              disabled={saving}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>ชื่อ</label>
          <input
            className="input"
            value={name}
            disabled={saving}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>สิทธิ์ (role)</label>
            <select
              className="input"
              value={role}
              disabled={saving}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>เบอร์โทร</label>
            <input
              className="input"
              value={phone}
              disabled={saving}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>ภาค / region</label>
            <input
              className="input"
              value={region}
              disabled={saving}
              placeholder="เช่น กรุงเทพฯ"
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="field">
            <label>ทีม</label>
            <input
              className="input"
              value={team}
              disabled={saving}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>
        </div>

        {role === 'SALES' && (
          <div className="field-row">
            <div className="field">
              <label>เป้าปิดดีล/วัน</label>
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={targetDailyClose}
                disabled={saving}
                onChange={(e) => setTargetDailyClose(e.target.value)}
              />
            </div>
            <div className="field">
              <label>คอมต่อดีล (บาท)</label>
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={commissionPerDeal}
                disabled={saving}
                placeholder="ไม่บังคับ"
                onChange={(e) => setCommissionPerDeal(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---- Edit modal ----

function EditModal({
  user,
  assignableRoles,
  onClose,
  onSaved,
}: {
  user: User;
  assignableRoles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [region, setRegion] = useState(user.region ?? '');
  const [team, setTeam] = useState(user.team ?? '');
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If editing an existing ADMIN as an ADMIN, keep ADMIN selectable even though
  // it isn't normally assignable; otherwise stick to the assignable list.
  const roleOptions = assignableRoles.includes(user.role)
    ? assignableRoles
    : [...assignableRoles, user.role];

  async function handleSave() {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ');
      return;
    }
    const body: UserUpdate = {
      name: name.trim(),
      phone: phone.trim() || null,
      region: region.trim() || null,
      team: team.trim() || null,
      role,
      active,
    };
    setSaving(true);
    try {
      await api.updateUser(user.id, body);
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
      title={`แก้ไขผู้ใช้ — ${user.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button
            className="btn btn-primary"
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
          <label>อีเมล</label>
          <input className="input" value={user.email} readOnly disabled />
        </div>

        <div className="field">
          <label>ชื่อ</label>
          <input
            className="input"
            value={name}
            disabled={saving}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>สิทธิ์ (role)</label>
            <select
              className="input"
              value={role}
              disabled={saving}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>เบอร์โทร</label>
            <input
              className="input"
              value={phone}
              disabled={saving}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>ภาค / region</label>
            <input
              className="input"
              value={region}
              disabled={saving}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="field">
            <label>ทีม</label>
            <input
              className="input"
              value={team}
              disabled={saving}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>
        </div>

        <label className="user-active-toggle">
          <input
            type="checkbox"
            checked={active}
            disabled={saving}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span>เปิดใช้งานบัญชีนี้</span>
        </label>
      </div>
    </Modal>
  );
}

// ---- Reset-password modal ----

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: User;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setSaving(true);
    try {
      await api.resetPassword(user.id, password);
      setDone(true);
      setSaving(false);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'รีเซ็ตรหัสผ่านไม่สำเร็จ',
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`รีเซ็ตรหัสผ่าน — ${user.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        done ? (
          <button className="btn btn-primary" onClick={onDone}>
            เสร็จสิ้น
          </button>
        ) : (
          <>
            <button className="btn" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก…' : 'ตั้งรหัสผ่านใหม่'}
            </button>
          </>
        )
      }
    >
      <div className="modal-form">
        {done ? (
          <div className="user-reset-done">
            ✅ ตั้งรหัสผ่านใหม่ให้ <strong>{user.name}</strong> เรียบร้อยแล้ว
            <div className="muted user-sub">
              แจ้งรหัสผ่านใหม่นี้ให้ผู้ใช้เพื่อเข้าสู่ระบบ
            </div>
          </div>
        ) : (
          <>
            {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}
            <div className="field">
              <label>รหัสผ่านใหม่</label>
              <input
                className="input"
                type="text"
                value={password}
                disabled={saving}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="muted user-sub">
              ผู้ใช้ <strong>{user.email}</strong> จะใช้รหัสผ่านนี้เข้าสู่ระบบ
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
