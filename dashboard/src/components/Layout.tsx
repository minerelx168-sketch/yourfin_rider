import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { DateRangeFilter } from './DateRangeFilter';
import { LastUpdatedReadout } from './LastUpdatedReadout';
import './Layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

// Inline SVG icons (currentColor) for the admin entries, matching the
// minimal nav style. 18px viewbox, stroke-based.
const WalletIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2Z" />
    <circle cx="16.5" cy="13" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

const AffiliateIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M7.7 7.8 11 15.4" />
    <path d="M16.3 7.8 13 15.4" />
  </svg>
);

const NAV: NavItem[] = [
  { to: '/', label: 'ภาพรวม', icon: '📊' },
  { to: '/leaderboard', label: 'อันดับเซลล์', icon: '🏆' },
  { to: '/map', label: 'แผนที่', icon: '🗺️' },
  { to: '/feed', label: 'กิจกรรมล่าสุด', icon: '⚡' },
  { to: '/withdrawals', label: 'ถอนคอมมิชชั่น', icon: WalletIcon },
  { to: '/affiliate', label: 'ตั้งค่าคอม/Affiliate', icon: AffiliateIcon },
];

export function Layout() {
  const { user, logout } = useAuth();

  const initials = (user?.name || '?').trim().charAt(0);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">YF</span>
          <div className="brand-text">
            <strong>YourFin Rider</strong>
            <span>Dashboard</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="zero-meeting">Zero-Meeting culture</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">YourFin Rider — Dashboard</h1>
            <LastUpdatedReadout />
          </div>
          <div className="topbar-right">
            <DateRangeFilter />
            <div className="topbar-user">
              <div className="user-meta">
                <strong>{user?.name}</strong>
                <span>{user?.role}</span>
              </div>
              <div className="user-avatar">{initials}</div>
              <button
                className="btn btn-ghost logout-btn"
                onClick={logout}
                title="ออกจากระบบ"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
