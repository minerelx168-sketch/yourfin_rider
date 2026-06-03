import type { ReactNode } from 'react';

export function LoadingBlock({ label = 'กำลังโหลดข้อมูล…' }: { label?: string }) {
  return (
    <div className="state">
      <div className="spinner" />
      <div>{label}</div>
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state error">
      <div style={{ fontSize: 28 }}>⚠️</div>
      <div style={{ fontWeight: 600 }}>เกิดข้อผิดพลาด</div>
      <div className="muted">{message}</div>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  message = 'ไม่มีข้อมูลในช่วงเวลาที่เลือก',
  icon = '📭',
}: {
  message?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="state">
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>{message}</div>
    </div>
  );
}
