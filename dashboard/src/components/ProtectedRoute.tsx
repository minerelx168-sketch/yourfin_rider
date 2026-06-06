import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { LoadingBlock } from './StateBlock';
import type { Role } from '../types';

/** Dashboard roles that may see *any* part of the dashboard. */
const DASHBOARD_ROLES: Role[] = ['MANAGER', 'FINANCE', 'ADMIN'];

/** Where a FINANCE user is sent when they land on a page they can't see. */
export const FINANCE_HOME = '/finance';

/** Default landing route per role (used after login / on unknown routes). */
// eslint-disable-next-line react-refresh/only-export-components -- tiny route helper colocated with the guard
export function homeForRole(role: Role | undefined): string {
  return role === 'FINANCE' ? FINANCE_HOME : '/';
}

/**
 * Auth gate for the whole dashboard shell:
 *  - while restoring the session -> spinner
 *  - no token -> redirect to /login
 *  - logged in but a non-dashboard role (SALES) -> friendly "no access" screen
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

  if (!DASHBOARD_ROLES.includes(user.role)) {
    return <NoAccess />;
  }

  return <>{children}</>;
}

/**
 * Per-route role gate (used inside the shell, so auth is already guaranteed).
 * If the current user's role isn't allowed:
 *  - FINANCE is redirected to its own home (never dropped on a page that 403s),
 *  - anyone else sees the friendly "no access" screen.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (user && allow.includes(user.role)) {
    return <>{children}</>;
  }
  if (user?.role === 'FINANCE') {
    return <Navigate to={FINANCE_HOME} replace />;
  }
  return <NoAccess />;
}

function NoAccess() {
  const { user, logout } = useAuth();
  return (
    <div className="noaccess">
      <div className="noaccess-card card card-pad">
        <div style={{ fontSize: 40 }}>🔒</div>
        <h2>ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="muted">
          หน้านี้ไม่เปิดให้สิทธิ์ระดับของคุณเข้าถึง
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
