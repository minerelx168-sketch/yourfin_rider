import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { DateRangeFilter } from './DateRangeFilter';
import { LastUpdatedReadout } from './LastUpdatedReadout';
import './Layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'ภาพรวม', icon: '📊' },
  { to: '/leaderboard', label: 'อันดับเซลล์', icon: '🏆' },
  { to: '/map', label: 'แผนที่', icon: '🗺️' },
  { to: '/feed', label: 'กิจกรรมล่าสุด', icon: '⚡' },
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
