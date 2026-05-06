import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getAdminTenantBranding,
  isUnauthorized,
  updateAdminTenantBranding,
} from "./admin-client.js";
import { AdminShell, navigateTo } from "./admin-shell.js";

export function AdminBrandingPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const brandingQuery = useQuery({
    queryKey: ["admin", "branding"],
    queryFn: getAdminTenantBranding,
    retry: false,
  });
  const updateMutation = useMutation({
    mutationFn: updateAdminTenantBranding,
    onSuccess: async (branding) => {
      setDisplayName(branding.displayName);
      setPrimaryColor(branding.primaryColor);
      await queryClient.invalidateQueries({ queryKey: ["admin", "branding"] });
    },
  });

  useEffect(() => {
    if (brandingQuery.data) {
      setDisplayName(brandingQuery.data.displayName);
      setPrimaryColor(brandingQuery.data.primaryColor);
    }
  }, [brandingQuery.data]);

  useEffect(() => {
    if (
      (brandingQuery.isError && isUnauthorized(brandingQuery.error)) ||
      (updateMutation.isError && isUnauthorized(updateMutation.error))
    ) {
      navigateTo("/admin/login");
    }
  }, [brandingQuery.error, brandingQuery.isError, updateMutation.error, updateMutation.isError]);

  const colorIsValid = /^#[0-9a-fA-F]{6}$/.test(primaryColor);
  const hasGenericError =
    (brandingQuery.isError && !isUnauthorized(brandingQuery.error)) ||
    (updateMutation.isError && !isUnauthorized(updateMutation.error));

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!colorIsValid) {
      return;
    }

    updateMutation.mutate({ displayName, primaryColor });
  }

  return (
    <AdminShell title="Branding" genericError={hasGenericError}>
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Identidade</h2>
          {brandingQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando branding...</p>
          ) : (
            <form className="grid gap-4" onSubmit={submit}>
              <label className="grid gap-2 text-sm font-medium text-card-foreground">
                Nome exibido
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-card-foreground">
                Cor primaria
                <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-2">
                  <input
                    aria-label="Amostra de cor"
                    type="color"
                    value={colorIsValid ? primaryColor : "#2563eb"}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-11 w-12 rounded-md border border-border bg-background"
                  />
                  <input
                    aria-label="Cor primaria hex"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                    required
                  />
                </div>
                {!colorIsValid ? (
                  <span className="text-sm text-red-700">Use uma cor no formato #RRGGBB.</span>
                ) : null}
              </label>
              <button
                type="submit"
                disabled={!colorIsValid}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="size-4" aria-hidden="true" />
                Salvar
              </button>
            </form>
          )}
        </section>

        <section className="rounded-md border border-border bg-card p-5" aria-label="Preview">
          <div
            className="rounded-md p-5 text-white"
            style={{ backgroundColor: colorIsValid ? primaryColor : "#2563eb" }}
          >
            <p className="text-sm font-medium opacity-90">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold">{displayName || "Nome do tenant"}</h2>
            <button
              type="button"
              className="mt-5 min-h-10 rounded-md bg-white px-4 text-sm font-semibold"
              style={{ color: colorIsValid ? primaryColor : "#2563eb" }}
            >
              Agendar horario
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
