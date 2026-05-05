import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
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

const routeTree = rootRoute.addChildren([indexRoute, bookingRoute]);

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
