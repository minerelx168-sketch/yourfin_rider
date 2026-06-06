import type { WithdrawalStatus } from '../types';
import {
  WITHDRAWAL_BG,
  WITHDRAWAL_COLOR,
  WITHDRAWAL_TEXT,
} from '../lib/status';
import { WITHDRAWAL_STATUS_LABEL } from '../lib/format';

/** Colored pill for a withdrawal status (mirrors StatusBadge). */
export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  return (
    <span
      className="badge"
      style={{
        background: WITHDRAWAL_BG[status],
        color: WITHDRAWAL_TEXT[status],
      }}
    >
      <span className="dot" style={{ background: WITHDRAWAL_COLOR[status] }} />
      {WITHDRAWAL_STATUS_LABEL[status]}
    </span>
  );
}
