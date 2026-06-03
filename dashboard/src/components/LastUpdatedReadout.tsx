import { useLastUpdated } from '../lastupdated/useLastUpdated';
import { formatClock } from '../lib/format';

/** Topbar readout of the most recent successful data refresh. */
export function LastUpdatedReadout() {
  const { lastUpdated } = useLastUpdated();
  return (
    <span className="last-updated" title="อัปเดตข้อมูลอัตโนมัติทุก 60 วินาที">
      <span className="pulse" />
      อัปเดตล่าสุด {lastUpdated ? formatClock(lastUpdated) : '—'}
    </span>
  );
}
