import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { LoadingBlock } from './StateBlock';

/**
 * Gate for dashboard routes:
 *  - while restoring the session -> spinner
 *  - no token -> redirect to /login
 *  - logged in but SALES role -> friendly "no access" screen
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <LoadingBlock label="กำลังตรวจสอบสิทธิ์…" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Session restored but /auth/me hasn't resolved yet (rare race) -> spinner.
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <LoadingBlock label="กำลังโหลดข้อมูลผู้ใช้…" />
      </div>
    );
  }

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return <NoAccess />;
  }

  return <>{children}</>;
}

function NoAccess() {
  const { user, logout } = useAuth();
  return (
    <div className="noaccess">
      <div className="noaccess-card card card-pad">
        <div style={{ fontSize: 40 }}>🔒</div>
        <h2>ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="muted">
          แดชบอร์ดนี้สำหรับผู้จัดการและผู้ดูแลระบบเท่านั้น
          <br />
          บัญชีของคุณ ({user?.email}) มีสิทธิ์ระดับ{' '}
          <strong>{user?.role}</strong>
        </p>
        <button className="btn btn-primary" onClick={logout}>
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
