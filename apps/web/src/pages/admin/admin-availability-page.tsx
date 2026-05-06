import type { AvailabilityBlock, WorkingHour } from "@agendarhorario/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminAvailabilityBlock,
  deleteAdminAvailabilityBlock,
  isUnauthorized,
  listAdminAvailabilityBlocks,
  listAdminWorkingHours,
  replaceAdminWorkingHours,
} from "./admin-client.js";
import { AdminShell, navigateTo } from "./admin-shell.js";

type DayDraft = {
  enabled: boolean;
  intervals: { id: string; start: string; end: string }[];
};

const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terca-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
] as const;

export function AdminAvailabilityPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DayDraft[]>(createEmptyDraft);
  const [blockForm, setBlockForm] = useState({
    startsAt: "2026-05-05T09:00",
    endsAt: "2026-05-05T10:00",
    reason: "",
  });
  const workingHoursQuery = useQuery({
    queryKey: ["admin", "availability", "working-hours"],
    queryFn: listAdminWorkingHours,
    retry: false,
  });
  const blocksQuery = useQuery({
    queryKey: ["admin", "availability", "blocks"],
    queryFn: listAdminAvailabilityBlocks,
    retry: false,
  });
  const saveWorkingHoursMutation = useMutation({
    mutationFn: replaceAdminWorkingHours,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "availability", "working-hours"] });
    },
  });
  const createBlockMutation = useMutation({
    mutationFn: createAdminAvailabilityBlock,
    onSuccess: async () => {
      setBlockForm({ startsAt: "", endsAt: "", reason: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "availability", "blocks"] });
    },
  });
  const deleteBlockMutation = useMutation({
    mutationFn: deleteAdminAvailabilityBlock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "availability", "blocks"] });
    },
  });

  useEffect(() => {
    if (workingHoursQuery.data) {
      setDraft(toDraft(workingHoursQuery.data));
    }
  }, [workingHoursQuery.data]);

  const errors = [
    workingHoursQuery.error,
    blocksQuery.error,
    saveWorkingHoursMutation.error,
    createBlockMutation.error,
    deleteBlockMutation.error,
  ];
  const hasUnauthorized = errors.some(isUnauthorized);

  useEffect(() => {
    if (hasUnauthorized) {
      navigateTo("/admin/login");
    }
  }, [hasUnauthorized]);

  const hasGenericError =
    (workingHoursQuery.isError && !isUnauthorized(workingHoursQuery.error)) ||
    (blocksQuery.isError && !isUnauthorized(blocksQuery.error)) ||
    saveWorkingHoursMutation.isError ||
    createBlockMutation.isError ||
    deleteBlockMutation.isError;

  const sortedBlocks = useMemo(() => sortBlocks(blocksQuery.data ?? []), [blocksQuery.data]);

  function saveWorkingHours(): void {
    saveWorkingHoursMutation.mutate({
      workingHours: draft.flatMap((day, weekday) =>
        day.enabled
          ? day.intervals.map((interval) => ({
              weekday,
              startMinutes: timeToMinutes(interval.start),
              endMinutes: timeToMinutes(interval.end),
              isActive: true,
            }))
          : [],
      ),
    });
  }

  function createBlock(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createBlockMutation.mutate({
      startsAt: new Date(blockForm.startsAt),
      endsAt: new Date(blockForm.endsAt),
      reason: blockForm.reason.trim() || undefined,
    });
  }

  return (
    <AdminShell title="Disponibilidade" genericError={hasGenericError}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-md border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-card-foreground">Semana</h2>
            <button
              type="button"
              onClick={saveWorkingHours}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              <Save className="size-4" aria-hidden="true" />
              Salvar grade
            </button>
          </div>
          {workingHoursQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando disponibilidade...</p>
          ) : (
            <div className="grid gap-3">
              {draft.map((day, weekday) => (
                <div key={weekdays[weekday]} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(event) => updateDay(weekday, { enabled: event.target.checked })}
                      />
                      {weekdays[weekday]}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(weekday, {
                          enabled: true,
                          intervals: [...day.intervals, createInterval("13:00", "18:00")],
                        })
                      }
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Intervalo
                    </button>
                  </div>
                  {day.enabled ? (
                    <div className="mt-3 grid gap-2">
                      {day.intervals.map((interval, index) => (
                        <div key={interval.id} className="grid grid-cols-[1fr_1fr_44px] gap-2">
                          <input
                            aria-label={`${weekdays[weekday]} inicio ${index + 1}`}
                            type="time"
                            value={interval.start}
                            onChange={(event) =>
                              updateInterval(weekday, index, { start: event.target.value })
                            }
                            className="min-h-10 rounded-md border border-border bg-background px-2 text-sm"
                          />
                          <input
                            aria-label={`${weekdays[weekday]} fim ${index + 1}`}
                            type="time"
                            value={interval.end}
                            onChange={(event) =>
                              updateInterval(weekday, index, { end: event.target.value })
                            }
                            className="min-h-10 rounded-md border border-border bg-background px-2 text-sm"
                          />
                          <button
                            type="button"
                            aria-label={`Remover intervalo ${weekdays[weekday]} ${index + 1}`}
                            onClick={() =>
                              updateDay(weekday, {
                                intervals: day.intervals.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                            className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4">
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">Novo bloqueio</h2>
            <form className="grid gap-3" onSubmit={createBlock}>
              <label className="grid gap-2 text-sm font-medium">
                Inicio
                <input
                  type="datetime-local"
                  value={blockForm.startsAt}
                  onChange={(event) => setBlockForm({ ...blockForm, startsAt: event.target.value })}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Fim
                <input
                  type="datetime-local"
                  value={blockForm.endsAt}
                  onChange={(event) => setBlockForm({ ...blockForm, endsAt: event.target.value })}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Motivo
                <input
                  value={blockForm.reason}
                  onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
                  className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar bloqueio
              </button>
            </form>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">Bloqueios</h2>
            {blocksQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando bloqueios...</p>
            ) : sortedBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>
            ) : (
              <div className="grid gap-3">
                {sortedBlocks.map((block) => (
                  <article key={block.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-semibold">{formatBlockRange(block)}</p>
                    <p className="text-sm text-muted-foreground">{block.reason ?? "Sem motivo"}</p>
                    <button
                      type="button"
                      onClick={() => deleteBlockMutation.mutate(block.id)}
                      className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remover
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );

  function updateDay(weekday: number, patch: Partial<DayDraft>): void {
    setDraft((current) =>
      current.map((day, index) => (index === weekday ? { ...day, ...patch } : day)),
    );
  }

  function updateInterval(
    weekday: number,
    intervalIndex: number,
    patch: Partial<DayDraft["intervals"][number]>,
  ): void {
    const selectedDay = draft[weekday];
    if (!selectedDay) {
      return;
    }

    updateDay(weekday, {
      intervals: selectedDay.intervals.map((interval, index) =>
        index === intervalIndex ? { ...interval, ...patch } : interval,
      ),
    });
  }
}

function createEmptyDraft(): DayDraft[] {
  return weekdays.map(() => ({
    enabled: false,
    intervals: [createInterval("09:00", "18:00")],
  }));
}

function toDraft(workingHours: readonly WorkingHour[]): DayDraft[] {
  return weekdays.map((_, weekday) => {
    const intervals = workingHours
      .filter((hour) => hour.weekday === weekday && hour.isActive)
      .map((hour) => ({
        id: `${hour.id}-${hour.startMinutes}-${hour.endMinutes}`,
        start: minutesToTime(hour.startMinutes),
        end: minutesToTime(hour.endMinutes),
      }));

    return {
      enabled: intervals.length > 0,
      intervals: intervals.length > 0 ? intervals : [createInterval("09:00", "18:00")],
    };
  });
}

function createInterval(start: string, end: string): DayDraft["intervals"][number] {
  return {
    id: `${start}-${end}-${crypto.randomUUID()}`,
    start,
    end,
  };
}

function timeToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function sortBlocks(blocks: readonly AvailabilityBlock[]): readonly AvailabilityBlock[] {
  return [...blocks].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}

function formatBlockRange(block: AvailabilityBlock): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
  return `${formatter.format(block.startsAt)} - ${formatter.format(block.endsAt)}`;
}
