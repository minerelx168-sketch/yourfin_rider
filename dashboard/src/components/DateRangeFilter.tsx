import { useEffect, useState } from 'react';
import { useRange } from '../range/useRange';
import { daysAgoISO, todayISO } from '../lib/format';

/**
 * Global from/to date filter. Edits are local until both dates are valid and
 * from <= to, then they commit to the shared RangeContext (which drives every
 * page's data fetch). Includes quick presets.
 */
export function DateRangeFilter() {
  const { range, setRange } = useRange();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  // Keep the editable inputs in sync when the committed range changes elsewhere
  // (e.g. a preset button). Mirroring external state into local input state is
  // the intended use here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrom(range.from);
    setTo(range.to);
  }, [range.from, range.to]);

  const valid = from !== '' && to !== '' && from <= to;
  const dirty = from !== range.from || to !== range.to;

  const apply = () => {
    if (valid && dirty) setRange({ from, to });
  };

  const applyPreset = (days: number) => {
    setRange({ from: daysAgoISO(days - 1), to: todayISO() });
  };

  return (
    <div className="range-filter">
      <div className="range-presets">
        <button className="btn btn-ghost preset" onClick={() => applyPreset(1)}>
          วันนี้
        </button>
        <button className="btn btn-ghost preset" onClick={() => applyPreset(7)}>
          7 วัน
        </button>
        <button className="btn btn-ghost preset" onClick={() => applyPreset(30)}>
          30 วัน
        </button>
      </div>
      <div className="range-inputs">
        <input
          type="date"
          className="input range-input"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="วันที่เริ่มต้น"
        />
        <span className="range-sep">ถึง</span>
        <input
          type="date"
          className="input range-input"
          value={to}
          min={from || undefined}
          max={todayISO()}
          onChange={(e) => setTo(e.target.value)}
          aria-label="วันที่สิ้นสุด"
        />
        <button
          className="btn btn-primary"
          onClick={apply}
          disabled={!valid || !dirty}
        >
          ใช้
        </button>
      </div>
    </div>
  );
}
