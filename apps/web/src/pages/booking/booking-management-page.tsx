import {
  type PublicAppointment,
  type PublicSlot,
  reschedulePublicBookingSchema,
} from "@agendarhorario/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookingShell } from "./booking-shell.js";
import {
  cancelPublicBooking,
  getTenantBranding,
  isBookingConflict,
  isPublicBookingInvalidRequest,
  isPublicBookingNotFound,
  listPublicSlots,
  lookupPublicBooking,
  reschedulePublicBooking,
} from "./public-booking-client.js";
import { SlotStep } from "./slot-step.js";

export function BookingManagementPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const token = useManagementToken();
  const slotWindow = useMemo(createSlotWindow, []);
  const [appointment, setAppointment] = useState<PublicAppointment>();
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot>();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const brandingQuery = useQuery({
    queryKey: ["public-booking", "branding"],
    queryFn: getTenantBranding,
  });
  const lookupQuery = useQuery({
    queryKey: ["public-booking-management", "lookup", token],
    queryFn: () => lookupPublicBooking({ token: token ?? "" }),
    enabled: Boolean(token),
    retry: false,
  });
  const slotsQuery = useQuery({
    queryKey: [
      "public-booking-management",
      "slots",
      appointment?.serviceId,
      slotWindow.startsAt,
      slotWindow.endsAt,
    ],
    queryFn: () =>
      listPublicSlots(appointment?.serviceId ?? "", {
        startsAt: slotWindow.startsAt,
        endsAt: slotWindow.endsAt,
      }),
    enabled: Boolean(appointment && appointment.status === "confirmed"),
  });

  useEffect(() => {
    if (lookupQuery.data) {
      setAppointment(lookupQuery.data);
    }
  }, [lookupQuery.data]);

  const cancelMutation = useMutation({
    mutationFn: cancelPublicBooking,
    onSuccess: (canceledAppointment) => {
      setAppointment(canceledAppointment);
      setIsConfirmingCancel(false);
      setSelectedSlot(undefined);
      setConflictMessage(undefined);
      setSuccessMessage("Agendamento cancelado.");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: reschedulePublicBooking,
    onSuccess: async (rescheduledAppointment) => {
      setAppointment(rescheduledAppointment);
      setSelectedSlot(undefined);
      setConflictMessage(undefined);
      setSuccessMessage("Agendamento remarcado.");
      await queryClient.invalidateQueries({
        queryKey: ["public-booking-management", "slots", rescheduledAppointment.serviceId],
      });
    },
    onError: async (error) => {
      if (isBookingConflict(error)) {
        setSelectedSlot(undefined);
        setConflictMessage("Esse horario acabou de ser reservado.");
        await queryClient.invalidateQueries({
          queryKey: ["public-booking-management", "slots", appointment?.serviceId],
        });
        return;
      }

      setConflictMessage(undefined);
    },
  });

  const branding = brandingQuery.data ?? {
    displayName: "Agendar Horario",
    primaryColor: "#2563eb",
  };
  const hasInvalidLink = !token || isPublicBookingNotFound(lookupQuery.error);
  const hasGenericError =
    brandingQuery.isError ||
    slotsQuery.isError ||
    (lookupQuery.isError && !isPublicBookingNotFound(lookupQuery.error)) ||
    cancelMutation.isError ||
    (rescheduleMutation.isError &&
      !isBookingConflict(rescheduleMutation.error) &&
      !isPublicBookingInvalidRequest(rescheduleMutation.error));
  const hasInvalidReschedule =
    rescheduleMutation.isError && isPublicBookingInvalidRequest(rescheduleMutation.error);
  const isCanceled = appointment?.status === "canceled";

  return (
    <BookingShell
      displayName={branding.displayName}
      primaryColor={branding.primaryColor}
      title="Gerenciar agendamento"
    >
      {hasInvalidLink ? (
        <StatusPanel
          icon="warning"
          title="Link indisponivel"
          message="Nao foi possivel encontrar esse agendamento. Confira o link recebido por e-mail."
        />
      ) : lookupQuery.isLoading || brandingQuery.isLoading ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando agendamento...
        </div>
      ) : appointment ? (
        <div className="space-y-6">
          {successMessage ? (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {successMessage}
            </div>
          ) : null}
          {hasGenericError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Nao foi possivel concluir a acao. Tente novamente em instantes.
            </div>
          ) : null}
          {hasInvalidReschedule ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Esse horario nao esta mais disponivel para remarcacao.
            </div>
          ) : null}

          <AppointmentSummary appointment={appointment} />

          {isCanceled ? (
            <StatusPanel
              icon="success"
              title="Agendamento cancelado"
              message="Esse agendamento nao pode mais ser remarcado por este link."
            />
          ) : (
            <>
              <CancelSection
                isConfirming={isConfirmingCancel}
                isSubmitting={cancelMutation.isPending}
                onStart={() => {
                  setIsConfirmingCancel(true);
                  setSuccessMessage(undefined);
                }}
                onKeep={() => setIsConfirmingCancel(false)}
                onConfirm={() => {
                  if (token) {
                    cancelMutation.mutate({ token });
                  }
                }}
              />

              <section aria-labelledby="reschedule-title" className="space-y-4">
                <div>
                  <h2 id="reschedule-title" className="text-lg font-semibold text-foreground">
                    Remarcar horario
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Escolha um novo horario disponivel para o mesmo servico.
                  </p>
                </div>
                <SlotStep
                  slots={slotsQuery.data ?? []}
                  isLoading={slotsQuery.isLoading}
                  selectedStartsAt={selectedSlot?.startsAt.toISOString()}
                  conflictMessage={conflictMessage}
                  onSelect={(slot) => {
                    setSelectedSlot(slot);
                    setConflictMessage(undefined);
                    setSuccessMessage(undefined);
                  }}
                />
                {selectedSlot ? (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--public-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={rescheduleMutation.isPending}
                    onClick={() => {
                      if (!token) {
                        return;
                      }

                      const input = reschedulePublicBookingSchema.parse({
                        token,
                        startsAt: selectedSlot.startsAt.toISOString(),
                      });
                      rescheduleMutation.mutate(input);
                    }}
                  >
                    {rescheduleMutation.isPending ? "Remarcando..." : "Confirmar remarcacao"}
                  </button>
                ) : null}
              </section>
            </>
          )}
        </div>
      ) : null}
    </BookingShell>
  );
}

function AppointmentSummary({
  appointment,
}: {
  appointment: PublicAppointment;
}): React.JSX.Element {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <CalendarClock className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-card-foreground">Seu agendamento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Confira os dados antes de cancelar ou remarcar.
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <Detail label="Cliente" value={appointment.customerName} />
        <Detail label="Horario" value={formatDateTime(appointment.startsAt)} />
        <Detail
          label="Status"
          value={appointment.status === "confirmed" ? "Confirmado" : "Cancelado"}
        />
      </dl>
    </section>
  );
}

function CancelSection({
  isConfirming,
  isSubmitting,
  onStart,
  onKeep,
  onConfirm,
}: {
  isConfirming: boolean;
  isSubmitting: boolean;
  onStart: () => void;
  onKeep: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <section aria-labelledby="cancel-title" className="rounded-md border border-border bg-card p-5">
      <h2 id="cancel-title" className="text-lg font-semibold text-card-foreground">
        Cancelar agendamento
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Esta acao cancela o horario confirmado.
      </p>
      {isConfirming ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={onKeep}
          >
            Manter agendamento
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onClick={onStart}
        >
          Cancelar agendamento
        </button>
      )}
    </section>
  );
}

function StatusPanel({
  icon,
  title,
  message,
}: {
  icon: "success" | "warning";
  title: string;
  message: string;
}): React.JSX.Element {
  const Icon = icon === "success" ? CheckCircle2 : AlertTriangle;
  const tone = icon === "success" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-800";

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
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

function useManagementToken(): string | undefined {
  const token = new URLSearchParams(window.location.search).get("token")?.trim();
  return token ? token : undefined;
}

function createSlotWindow(): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date();
  startsAt.setUTCHours(0, 0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 14);

  return { startsAt, endsAt };
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}
