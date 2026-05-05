import type { PublicService } from "@agendarhorario/shared";
import { Scissors } from "lucide-react";

type ServiceStepProps = {
  services: readonly PublicService[];
  selectedServiceId?: string | undefined;
  onSelect: (service: PublicService) => void;
};

export function ServiceStep({
  services,
  selectedServiceId,
  onSelect,
}: ServiceStepProps): React.JSX.Element {
  if (services.length === 0) {
    return (
      <section className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
        Nenhum servico disponivel no momento.
      </section>
    );
  }

  return (
    <section aria-labelledby="service-step-title" className="space-y-3">
      <h2 id="service-step-title" className="text-lg font-semibold text-foreground">
        Escolha um servico
      </h2>
      <div className="grid gap-3">
        {services.map((service) => (
          <button
            type="button"
            key={service.id}
            onClick={() => onSelect(service)}
            className="flex min-h-20 w-full items-center gap-4 rounded-md border border-border bg-card p-4 text-left transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-pressed={selectedServiceId === service.id}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <Scissors className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-card-foreground">
                {service.name}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {service.durationMinutes} min · {formatPrice(service.priceCents)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}
