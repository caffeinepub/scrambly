import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, Link } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import GamesPage from './pages/GamesPage';
import BlockBlastGame from './pages/BlockBlastGame';
import SonicRunnerGame from './pages/SonicRunnerGame';
import CommunityPage from './pages/CommunityPage';
import AgeMatcher from './pages/AgeMatcher';
import ModerationDashboard from './pages/ModerationDashboard';
import ParentalDashboard from './pages/ParentalDashboard';
import SettingsPage from './pages/SettingsPage';
import AuthGate from './components/AuthGate';

// Root route with Layout
const rootRoute = createRootRoute({
  component: () => (
    <AuthGate>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGate>
  ),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-fredoka text-primary">404</div>
      <p className="text-muted-foreground font-nunito text-lg">Page not found!</p>
      <Link to="/" className="sonic-btn-primary">Go Home</Link>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SearchPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games',
  component: GamesPage,
});

const blockBlastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/blockblast',
  component: BlockBlastGame,
});

const sonicRunnerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/sonicrunner',
  component: SonicRunnerGame,
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community',
  component: CommunityPage,
});

const ageMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community/match',
  component: AgeMatcher,
});

const moderationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/moderation',
  component: ModerationDashboard,
});

const parentalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parental',
  component: ParentalDashboard,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  gamesRoute,
  blockBlastRoute,
  sonicRunnerRoute,
  communityRoute,
  ageMatchRoute,
  moderationRoute,
  parentalRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
