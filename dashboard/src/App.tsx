import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { RangeProvider } from './range/RangeProvider';
import { LastUpdatedProvider } from './lastupdated/LastUpdatedProvider';
import {
  ProtectedRoute,
  RoleGate,
  homeForRole,
} from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { LoadingBlock } from './components/StateBlock';

// Code-split the data pages so the initial bundle (esp. recharts + leaflet)
// loads lazily per route.
const OverviewPage = lazy(() =>
  import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({
    default: m.LeaderboardPage,
  })),
);
const MapPage = lazy(() =>
  import('./pages/MapPage').then((m) => ({ default: m.MapPage })),
);
const FeedPage = lazy(() =>
  import('./pages/FeedPage').then((m) => ({ default: m.FeedPage })),
);
const WithdrawalsPage = lazy(() =>
  import('./pages/WithdrawalsPage').then((m) => ({
    default: m.WithdrawalsPage,
  })),
);
const AffiliatePage = lazy(() =>
  import('./pages/AffiliatePage').then((m) => ({ default: m.AffiliatePage })),
);
const UsersPage = lazy(() =>
  import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const FinanceOverviewPage = lazy(() =>
  import('./pages/FinanceOverviewPage').then((m) => ({
    default: m.FinanceOverviewPage,
  })),
);
const SlipVaultPage = lazy(() =>
  import('./pages/SlipVaultPage').then((m) => ({ default: m.SlipVaultPage })),
);

/** Providers + chrome that wrap every authenticated dashboard page. */
function DashboardShell() {
  return (
    <ProtectedRoute>
      <RangeProvider>
        <LastUpdatedProvider>
          <Layout />
        </LastUpdatedProvider>
      </RangeProvider>
    </ProtectedRoute>
  );
}

/** Sends each role to its proper landing page (sales overview vs finance). */
function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeForRole(user?.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
              <LoadingBlock />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardShell />}>
              {/* Sales analytics — MANAGER + ADMIN only (FINANCE redirected). */}
              <Route
                path="/"
                element={
                  <RoleGate allow={['MANAGER', 'ADMIN']}>
                    <OverviewPage />
                  </RoleGate>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <RoleGate allow={['MANAGER', 'ADMIN']}>
                    <LeaderboardPage />
                  </RoleGate>
                }
              />
              <Route
                path="/map"
                element={
                  <RoleGate allow={['MANAGER', 'ADMIN']}>
                    <MapPage />
                  </RoleGate>
                }
              />
              <Route
                path="/feed"
                element={
                  <RoleGate allow={['MANAGER', 'ADMIN']}>
                    <FeedPage />
                  </RoleGate>
                }
              />

              {/* Finance — FINANCE + MANAGER + ADMIN. */}
              <Route
                path="/finance"
                element={
                  <RoleGate allow={['FINANCE', 'MANAGER', 'ADMIN']}>
                    <FinanceOverviewPage />
                  </RoleGate>
                }
              />
              <Route
                path="/withdrawals"
                element={
                  <RoleGate allow={['FINANCE', 'MANAGER', 'ADMIN']}>
                    <WithdrawalsPage />
                  </RoleGate>
                }
              />
              <Route
                path="/finance/slips"
                element={
                  <RoleGate allow={['FINANCE', 'MANAGER', 'ADMIN']}>
                    <SlipVaultPage />
                  </RoleGate>
                }
              />

              {/* User management — MANAGER + ADMIN. */}
              <Route
                path="/users"
                element={
                  <RoleGate allow={['MANAGER', 'ADMIN']}>
                    <UsersPage />
                  </RoleGate>
                }
              />

              {/* Affiliate — ADMIN only. */}
              <Route
                path="/affiliate"
                element={
                  <RoleGate allow={['ADMIN']}>
                    <AffiliatePage />
                  </RoleGate>
                }
              />
            </Route>
            <Route path="*" element={<RoleHomeRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
