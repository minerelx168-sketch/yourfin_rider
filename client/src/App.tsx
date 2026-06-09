import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Mobile pages
import MobileHome from "./pages/mobile/MobileHome";
import MobileCheckIn from "./pages/mobile/MobileCheckIn";
import MobileMap from "./pages/mobile/MobileMap";
import MobileProfile from "./pages/mobile/MobileProfile";

// Dashboard pages
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardLeaderboard from "./pages/dashboard/DashboardLeaderboard";
import DashboardMap from "./pages/dashboard/DashboardMap";
import DashboardFeed from "./pages/dashboard/DashboardFeed";
import DashboardUsers from "./pages/dashboard/DashboardUsers";

// Landing / Role router
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Mobile PWA routes */}
      <Route path="/m" component={MobileHome} />
      <Route path="/m/checkin" component={MobileCheckIn} />
      <Route path="/m/map" component={MobileMap} />
      <Route path="/m/profile" component={MobileProfile} />
      {/* Dashboard routes */}
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/dashboard/leaderboard" component={DashboardLeaderboard} />
      <Route path="/dashboard/map" component={DashboardMap} />
      <Route path="/dashboard/feed" component={DashboardFeed} />
      <Route path="/dashboard/users" component={DashboardUsers} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
