import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { DateRangeFilter } from './DateRangeFilter';
import { LastUpdatedReadout } from './LastUpdatedReadout';
import { ROLE_LABEL } from '../lib/format';
import type { Role } from '../types';
import './Layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  end?: boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

// Inline SVG icons (currentColor), matching the minimal nav style. 18px, stroke-based.
const WalletIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2Z" />
    <circle cx="16.5" cy="13" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

const FinanceIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 13h4l2 5 4-12 2 7h6" />
  </svg>
);

const SlipIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

const AffiliateIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M7.7 7.8 11 15.4" />
    <path d="M16.3 7.8 13 15.4" />
  </svg>
);

const SALES: Role[] = ['MANAGER', 'ADMIN'];
const FINANCE: Role[] = ['FINANCE', 'MANAGER', 'ADMIN'];
const ADMIN_ONLY: Role[] = ['ADMIN'];

const SECTIONS: NavSection[] = [
  {
    heading: 'การขาย',
    items: [
      { to: '/', label: 'ภาพรวม', icon: '📊', roles: SALES, end: true },
      { to: '/leaderboard', label: 'อันดับเซลล์', icon: '🏆', roles: SALES },
      { to: '/map', label: 'แผนที่', icon: '🗺️', roles: SALES },
      { to: '/feed', label: 'กิจกรรมล่าสุด', icon: '⚡', roles: SALES },
    ],
  },
  {
    heading: 'การเงิน',
    items: [
      { to: '/finance', label: 'ภาพรวมการเงิน', icon: FinanceIcon, roles: FINANCE, end: true },
      { to: '/withdrawals', label: 'รายการถอน', icon: WalletIcon, roles: FINANCE },
      { to: '/finance/slips', label: 'คลังสลิป', icon: SlipIcon, roles: FINANCE },
    ],
  },
  {
    heading: 'ผู้ดูแลระบบ',
    items: [
      { to: '/affiliate', label: 'ตั้งค่าคอม/Affiliate', icon: AffiliateIcon, roles: ADMIN_ONLY },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const initials = (user?.name || '?').trim().charAt(0);

  // Only show sections/items the current role may access.
  const sections = SECTIONS.map((s) => ({
    heading: s.heading,
    items: s.items.filter((i) => (role ? i.roles.includes(role) : false)),
  })).filter((s) => s.items.length > 0);

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
          {sections.map((section) => (
            <div key={section.heading}>
              <div className="nav-section-label">{section.heading}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
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
            {/* Date range drives the sales analytics pages; finance pages don't use it. */}
            {role !== 'FINANCE' && <DateRangeFilter />}
            <div className="topbar-user">
              <div className="user-meta">
                <strong>{user?.name}</strong>
                <span>{role ? ROLE_LABEL[role] : ''}</span>
              </div>
              <div className="user-avatar">{initials}</div>
              <button className="btn btn-ghost logout-btn" onClick={logout} title="ออกจากระบบ">
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
