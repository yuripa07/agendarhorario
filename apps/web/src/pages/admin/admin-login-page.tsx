import { useMutation } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { signInAdmin } from "./admin-client.js";

export function AdminLoginPage(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();

  const signInMutation = useMutation({
    mutationFn: signInAdmin,
    onSuccess: () => {
      setErrorMessage(undefined);
      navigateTo("/admin/calendar");
    },
    onError: () => {
      setErrorMessage("Nao foi possivel entrar. Confira os dados.");
    },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-8 text-foreground">
      <section className="w-full max-w-sm rounded-md border border-border bg-card p-5">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Painel administrativo</p>
            <h1 className="text-2xl font-semibold tracking-normal text-card-foreground">Entrar</h1>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          aria-label="Login administrativo"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            signInMutation.mutate({ email, password });
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-card-foreground">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoComplete="email"
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
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={signInMutation.isPending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signInMutation.isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function navigateTo(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
