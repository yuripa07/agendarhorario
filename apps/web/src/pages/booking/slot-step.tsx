import type { PublicSlot } from "@agendarhorario/shared";
import { Clock } from "lucide-react";

type SlotStepProps = {
  slots: readonly PublicSlot[];
  isLoading: boolean;
  selectedStartsAt?: string | undefined;
  conflictMessage?: string | undefined;
  onSelect: (slot: PublicSlot) => void;
};

export function SlotStep({
  slots,
  isLoading,
  selectedStartsAt,
  conflictMessage,
  onSelect,
}: SlotStepProps): React.JSX.Element {
  return (
    <section aria-labelledby="slot-step-title" className="space-y-3">
      <h2 id="slot-step-title" className="text-lg font-semibold text-foreground">
        Escolha um horario
      </h2>
      {conflictMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {conflictMessage}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando horarios...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Nenhum horario disponivel para esse servico.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((slot) => {
            const startsAt = slot.startsAt.toISOString();

            return (
              <button
                type="button"
                key={startsAt}
                onClick={() => onSelect(slot)}
                aria-pressed={selectedStartsAt === startsAt}
                className="flex min-h-14 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-card-foreground transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary aria-pressed:border-primary aria-pressed:bg-muted"
              >
                <Clock className="size-4" aria-hidden="true" />
                {formatTime(slot.startsAt)}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}
