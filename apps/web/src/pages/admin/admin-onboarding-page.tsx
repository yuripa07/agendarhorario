import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { acceptTenantInvite, lookupTenantInvite, signInAdmin } from "./admin-client.js";

export function AdminOnboardingPage(): React.JSX.Element {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();

  const inviteQuery = useQuery({
    queryKey: ["tenant-invite", token],
    queryFn: () => lookupTenantInvite({ token }),
    enabled: token.length > 0,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const accepted = await acceptTenantInvite({ token, name, password });
      await signInAdmin({ email: accepted.adminEmail, password });
      return accepted;
    },
    onSuccess: () => {
      setErrorMessage(undefined);
      navigateTo("/admin/calendar");
    },
    onError: () => {
      setErrorMessage("Nao foi possivel ativar este convite.");
    },
  });

  const invite = inviteQuery.data;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-8 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-5">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Painel administrativo</p>
            <h1 className="text-2xl font-semibold tracking-normal text-card-foreground">
              Ativar tenant
            </h1>
          </div>
        </div>

        {!token || inviteQuery.isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Convite invalido ou expirado.
          </div>
        ) : null}

        {inviteQuery.isLoading ? (
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            Carregando convite...
          </div>
        ) : null}

        {invite ? (
          <>
            <div className="mb-5 rounded-md border border-border bg-background p-3">
              <p className="text-sm text-muted-foreground">Tenant</p>
              <p className="font-medium text-foreground">{invite.tenantDisplayName}</p>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form
              aria-label="Ativacao de tenant"
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                acceptMutation.mutate();
              }}
            >
              <label className="grid gap-2 text-sm font-medium text-card-foreground">
                E-mail
                <input
                  type="email"
                  value={invite.adminEmail}
                  disabled
                  className="min-h-11 rounded-md border border-border bg-muted px-3 text-base text-muted-foreground"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-card-foreground">
                Nome
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-card-foreground">
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={acceptMutation.isPending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptMutation.isPending ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}

function navigateTo(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
