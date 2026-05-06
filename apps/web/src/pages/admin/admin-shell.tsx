import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, LogOut, Paintbrush, Scissors } from "lucide-react";
import { useEffect } from "react";
import { getAdminSession, isUnauthorized, signOutAdmin } from "./admin-client.js";

const navItems = [
  { href: "/admin/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/admin/services", label: "Servicos", icon: Scissors },
  { href: "/admin/availability", label: "Disponibilidade", icon: Clock },
  { href: "/admin/branding", label: "Branding", icon: Paintbrush },
] as const;

export function AdminShell({
  title,
  children,
  genericError,
}: {
  title: string;
  children: React.ReactNode;
  genericError?: boolean;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["admin", "session"],
    queryFn: getAdminSession,
    retry: false,
  });
  const signOutMutation = useMutation({
    mutationFn: signOutAdmin,
    onSuccess: async () => {
      await queryClient.clear();
      navigateTo("/admin/login");
    },
  });

  useEffect(() => {
    if (sessionQuery.isError && isUnauthorized(sessionQuery.error)) {
      navigateTo("/admin/login");
    }
  }, [sessionQuery.error, sessionQuery.isError]);

  if (sessionQuery.isLoading || (sessionQuery.isError && isUnauthorized(sessionQuery.error))) {
    return <AdminLoading />;
  }

  const hasGenericError =
    genericError || sessionQuery.isError || (signOutMutation.isError && !signOutMutation.isPending);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {sessionQuery.data?.user.email}
                </p>
                <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOutMutation.mutate()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto rounded-md border border-border bg-card p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(item.href);
                  }}
                  className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition hover:bg-muted ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </header>

        {hasGenericError ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Nao foi possivel carregar o painel. Tente novamente em instantes.
          </div>
        ) : null}

        {children}
      </section>
    </main>
  );
}

export function AdminLoading(): React.JSX.Element {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 text-sm text-muted-foreground">
      Carregando painel...
    </main>
  );
}

export function navigateTo(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
