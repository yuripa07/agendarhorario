import type { Service } from "@agendarhorario/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Power, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAdminService,
  deactivateAdminService,
  isUnauthorized,
  listAdminServices,
  updateAdminService,
} from "./admin-client.js";
import { AdminShell, navigateTo } from "./admin-shell.js";

type ServiceForm = {
  name: string;
  durationMinutes: string;
  price: string;
};

const emptyForm: ServiceForm = {
  name: "",
  durationMinutes: "60",
  price: "0,00",
};

export function AdminServicesPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const servicesQuery = useQuery({
    queryKey: ["admin", "services"],
    queryFn: listAdminServices,
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: createAdminService,
    onSuccess: async () => {
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: updateAdminService,
    onSuccess: async () => {
      setEditingId(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });

  useUnauthorizedRedirect(servicesQuery.error, servicesQuery.isError);
  useUnauthorizedRedirect(createMutation.error, createMutation.isError);
  useUnauthorizedRedirect(updateMutation.error, updateMutation.isError);
  useUnauthorizedRedirect(deactivateMutation.error, deactivateMutation.isError);

  const hasGenericError =
    (servicesQuery.isError && !isUnauthorized(servicesQuery.error)) ||
    createMutation.isError ||
    updateMutation.isError ||
    deactivateMutation.isError;
  const services = servicesQuery.data ?? [];
  const editingService = services.find((service) => service.id === editingId);

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const payload = {
      name: form.name,
      durationMinutes: Number(form.durationMinutes),
      priceCents: parseBrlToCents(form.price),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(service: Service): void {
    setEditingId(service.id);
    setForm({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      price: formatPriceInput(service.priceCents),
    });
  }

  return (
    <AdminShell title="Servicos" genericError={hasGenericError}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-3" aria-label="Lista de servicos">
          {servicesQuery.isLoading ? (
            <PanelText>Carregando servicos...</PanelText>
          ) : services.length === 0 ? (
            <PanelText>Nenhum servico cadastrado.</PanelText>
          ) : (
            services.map((service) => (
              <article
                key={service.id}
                className={`rounded-md border p-4 ${
                  service.isActive
                    ? "border-border bg-card"
                    : "border-zinc-300 bg-zinc-100 text-muted-foreground"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">{service.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {service.durationMinutes} min - {formatBrl(service.priceCents)}
                    </p>
                    <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                      {service.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted"
                    >
                      <Edit3 className="size-4" aria-hidden="true" />
                      Editar
                    </button>
                    {service.isActive ? (
                      <button
                        type="button"
                        onClick={() => deactivateMutation.mutate(service.id)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Power className="size-4" aria-hidden="true" />
                        Desativar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-md border border-border bg-card p-4" aria-label="Formulario">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            {editingService ? "Editar servico" : "Novo servico"}
          </h2>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-medium text-card-foreground">
              Nome
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-card-foreground">
              Duracao em minutos
              <input
                type="number"
                min="5"
                max="1440"
                step="5"
                value={form.durationMinutes}
                onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-card-foreground">
              Preco
              <input
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                required
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                {editingId ? (
                  <Save className="size-4" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {editingId ? "Salvar" : "Criar"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

function PanelText({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function useUnauthorizedRedirect(error: unknown, isError: boolean): void {
  useEffect(() => {
    if (isError && isUnauthorized(error)) {
      navigateTo("/admin/login");
    }
  }, [error, isError]);
}

function parseBrlToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Math.round(Number(normalized) * 100);
}

function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatBrl(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
