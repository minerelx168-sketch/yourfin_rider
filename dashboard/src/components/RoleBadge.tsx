import type { Role } from '../types';
import { ROLE_BG, ROLE_DOT, ROLE_TEXT } from '../lib/status';
import { ROLE_LABEL } from '../lib/format';

/** Colored pill for a user role (mirrors StatusBadge / WithdrawalStatusBadge). */
export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className="badge"
      style={{ background: ROLE_BG[role], color: ROLE_TEXT[role] }}
    >
      <span className="dot" style={{ background: ROLE_DOT[role] }} />
      {ROLE_LABEL[role]}
    </span>
  );
}
