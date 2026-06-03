import type { ReactNode } from 'react';
import './Scorecard.css';

interface ScorecardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  accent?: string;
  sub?: ReactNode;
}

export function Scorecard({
  label,
  value,
  unit,
  icon,
  accent = 'var(--brand)',
  sub,
}: ScorecardProps) {
  return (
    <div className="scorecard card">
      <div className="scorecard-top">
        <span className="scorecard-label">{label}</span>
        {icon && (
          <span
            className="scorecard-icon"
            style={{ background: `${accent}1a`, color: accent }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="scorecard-value">
        {value}
        {unit && <span className="scorecard-unit">{unit}</span>}
      </div>
      {sub && <div className="scorecard-sub">{sub}</div>}
    </div>
  );
}
