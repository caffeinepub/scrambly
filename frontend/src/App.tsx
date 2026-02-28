import React from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

import Layout from "./components/Layout";
import AuthGate from "./components/AuthGate";

// Pages
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import VideosPage from "./pages/VideosPage";
import GamesPage from "./pages/GamesPage";
import CommunityPage from "./pages/CommunityPage";
import FriendsModePage from "./pages/FriendsModePage";
import SettingsPage from "./pages/SettingsPage";
import ParentalDashboard from "./pages/ParentalDashboard";
import AdminPanel from "./pages/AdminPanel";
import AppealPage from "./pages/AppealPage";
import AgeMatcher from "./pages/AgeMatcher";
import ModerationDashboard from "./pages/ModerationDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Root route with Layout
const rootRoute = createRootRoute({
  component: () => (
    <AuthGate>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGate>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

const videosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/videos",
  component: VideosPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games",
  component: GamesPage,
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/community",
  component: CommunityPage,
});

const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: FriendsModePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const parentalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parental",
  component: ParentalDashboard,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPanel,
});

const appealRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/appeal",
  component: AppealPage,
});

const ageMatcherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/age-matcher",
  component: AgeMatcher,
});

const moderationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/moderation",
  component: ModerationDashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  videosRoute,
  gamesRoute,
  communityRoute,
  friendsRoute,
  settingsRoute,
  parentalRoute,
  adminRoute,
  appealRoute,
  ageMatcherRoute,
  moderationRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
