import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { AdminCalendarPage } from "../pages/admin/admin-calendar-page.js";
import { AdminLoginPage } from "../pages/admin/admin-login-page.js";
import { BookingManagementPage } from "../pages/booking/booking-management-page.js";
import { BookingPage } from "../pages/booking/booking-page.js";
import { HomePage } from "../pages/home/HomePage.js";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/booking",
  component: BookingPage,
});

const bookingManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/booking/manage",
  component: BookingManagementPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const adminCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/calendar",
  component: AdminCalendarPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  bookingRoute,
  bookingManagementRoute,
  adminLoginRoute,
  adminCalendarRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
