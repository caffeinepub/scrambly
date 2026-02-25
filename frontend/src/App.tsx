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
import VideosPage from './pages/VideosPage';
import AppealPage from './pages/AppealPage';
import FriendsModePage from './pages/FriendsModePage';
import AuthGate from './components/AuthGate';

// Root route with Layout (requires auth)
const rootRoute = createRootRoute({
  component: () => (
    <Outlet />
  ),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-fredoka text-primary">404</div>
      <p className="text-muted-foreground font-nunito text-lg">Page not found!</p>
      <Link to="/" className="sonic-btn-primary">Go Home</Link>
    </div>
  ),
});

// Auth-gated layout route — wraps all normal pages
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  component: () => (
    <AuthGate>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGate>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/',
  component: SearchPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/games',
  component: GamesPage,
});

const blockBlastRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/games/blockblast',
  component: BlockBlastGame,
});

const sonicRunnerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/games/sonicrunner',
  component: SonicRunnerGame,
});

const communityRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/community',
  component: CommunityPage,
});

const ageMatchRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/community/match',
  component: AgeMatcher,
});

const moderationRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/admin/moderation',
  component: ModerationDashboard,
});

const parentalRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/parental',
  component: ParentalDashboard,
});

const settingsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/settings',
  component: SettingsPage,
});

const videosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/videos',
  component: VideosPage,
});

const friendsModeRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/friends',
  component: FriendsModePage,
});

// Appeal route — accessible without auth gate so banned users can reach it
const appealRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/appeal',
  component: AppealPage,
});

const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([
    indexRoute,
    gamesRoute,
    blockBlastRoute,
    sonicRunnerRoute,
    communityRoute,
    ageMatchRoute,
    moderationRoute,
    parentalRoute,
    settingsRoute,
    videosRoute,
    friendsModeRoute,
  ]),
  appealRoute,
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
