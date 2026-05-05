import type { PublicAppointment, PublicService } from "@agendarhorario/shared";
import { CheckCircle2 } from "lucide-react";

type BookingConfirmationProps = {
  appointment: PublicAppointment;
  service?: PublicService | undefined;
};

export function BookingConfirmation({
  appointment,
  service,
}: BookingConfirmationProps): React.JSX.Element {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-card-foreground">Agendamento confirmado</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enviamos os detalhes para o e-mail informado.
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <Detail label="Cliente" value={appointment.customerName} />
        <Detail label="Servico" value={service?.name ?? "Servico selecionado"} />
        <Detail label="Horario" value={formatDateTime(appointment.startsAt)} />
      </dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="grid gap-1 rounded-md bg-muted p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}
