import type { VisitStatus } from '../types';
import { STATUS_BG, STATUS_COLOR, STATUS_TEXT } from '../lib/status';
import { VISIT_STATUS_LABEL } from '../lib/format';

export function StatusBadge({ status }: { status: VisitStatus | null }) {
  if (!status) {
    return (
      <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
        —
      </span>
    );
  }
  return (
    <span
      className="badge"
      style={{ background: STATUS_BG[status], color: STATUS_TEXT[status] }}
    >
      <span className="dot" style={{ background: STATUS_COLOR[status] }} />
      {VISIT_STATUS_LABEL[status]}
    </span>
  );
}
