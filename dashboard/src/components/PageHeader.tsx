import type { ReactNode } from 'react';
import { useRange } from '../range/useRange';

interface PageHeaderProps {
  title: string;
  refreshing?: boolean;
  actions?: ReactNode;
}

/** Standard page heading: title + the active date range + a refreshing hint. */
export function PageHeader({ title, refreshing, actions }: PageHeaderProps) {
  const { range } = useRange();
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        <div className="sub">
          ช่วงข้อมูล: {range.from} ถึง {range.to}
        </div>
      </div>
      <div className="row gap-12">
        {refreshing && (
          <span className="refresh-tag">
            <span
              className="spinner"
              style={{ width: 14, height: 14, borderWidth: 2 }}
            />
            กำลังอัปเดต…
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
