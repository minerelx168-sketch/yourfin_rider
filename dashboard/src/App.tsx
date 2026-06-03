import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RangeProvider } from './range/RangeProvider';
import { LastUpdatedProvider } from './lastupdated/LastUpdatedProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
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
              <Route path="/" element={<OverviewPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/feed" element={<FeedPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
