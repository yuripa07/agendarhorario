import {
  type CreatePublicBookingInput,
  createPublicBookingSchema,
  type PublicAppointment,
  type PublicService,
  type PublicSlot,
} from "@agendarhorario/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BookingConfirmation } from "./booking-confirmation.js";
import { CustomerDetailsStep } from "./customer-details-step.js";
import {
  createPublicBooking,
  getTenantBranding,
  isBookingConflict,
  listPublicServices,
  listPublicSlots,
} from "./public-booking-client.js";
import { ServiceStep } from "./service-step.js";
import { SlotStep } from "./slot-step.js";

const customerDetailsSchema = z.object({
  customerName: z.string().trim().min(1, "Informe seu nome.").max(120),
  customerEmail: z.string().trim().email("Informe um e-mail valido.").max(254),
  customerPhone: z.string().trim().min(8, "Informe um telefone valido.").max(32),
  privacyAccepted: z.boolean().refine((value) => value, {
    message: "Aceite a politica de privacidade para continuar.",
  }),
});

export type CustomerDetailsFormValues = z.infer<typeof customerDetailsSchema>;

export function BookingPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<PublicService>();
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot>();
  const [confirmedAppointment, setConfirmedAppointment] = useState<PublicAppointment>();
  const [conflictMessage, setConflictMessage] = useState<string>();
  const slotWindow = useMemo(createSlotWindow, []);

  const brandingQuery = useQuery({
    queryKey: ["public-booking", "branding"],
    queryFn: getTenantBranding,
  });
  const servicesQuery = useQuery({
    queryKey: ["public-booking", "services"],
    queryFn: listPublicServices,
  });
  const slotsQuery = useQuery({
    queryKey: [
      "public-booking",
      "slots",
      selectedService?.id,
      slotWindow.startsAt,
      slotWindow.endsAt,
    ],
    queryFn: () =>
      listPublicSlots(selectedService?.id ?? "", {
        startsAt: slotWindow.startsAt,
        endsAt: slotWindow.endsAt,
      }),
    enabled: Boolean(selectedService),
  });

  const form = useForm<CustomerDetailsFormValues>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      privacyAccepted: false,
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: createPublicBooking,
    onSuccess: (appointment) => {
      setConfirmedAppointment(appointment);
      setConflictMessage(undefined);
    },
    onError: async (error) => {
      if (isBookingConflict(error)) {
        setSelectedSlot(undefined);
        setConflictMessage("Esse horario acabou de ser reservado.");
        await queryClient.invalidateQueries({
          queryKey: ["public-booking", "slots", selectedService?.id],
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
  const services = servicesQuery.data ?? [];
  const fieldErrors = {
    customerName: form.formState.errors.customerName?.message,
    customerEmail: form.formState.errors.customerEmail?.message,
    customerPhone: form.formState.errors.customerPhone?.message,
    privacyAccepted: form.formState.errors.privacyAccepted?.message,
  };

  if (confirmedAppointment) {
    return (
      <BookingShell displayName={branding.displayName} primaryColor={branding.primaryColor}>
        <BookingConfirmation appointment={confirmedAppointment} service={selectedService} />
      </BookingShell>
    );
  }

  const hasGenericError =
    brandingQuery.isError ||
    servicesQuery.isError ||
    slotsQuery.isError ||
    (createBookingMutation.isError && !isBookingConflict(createBookingMutation.error));

  return (
    <BookingShell displayName={branding.displayName} primaryColor={branding.primaryColor}>
      {hasGenericError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Nao foi possivel carregar o agendamento. Tente novamente em instantes.
        </div>
      ) : null}
      {brandingQuery.isLoading || servicesQuery.isLoading ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando agendamento...
        </div>
      ) : (
        <form
          aria-label="Dados do cliente"
          className="space-y-8"
          onSubmit={form.handleSubmit((values) => {
            if (!selectedService || !selectedSlot) {
              return;
            }

            const input = createPublicBookingSchema.parse({
              serviceId: selectedService.id,
              startsAt: selectedSlot.startsAt.toISOString(),
              customerName: values.customerName,
              customerEmail: values.customerEmail,
              customerPhone: values.customerPhone,
              privacyAccepted: true,
            }) satisfies CreatePublicBookingInput;

            createBookingMutation.mutate(input);
          })}
        >
          <ServiceStep
            services={services}
            selectedServiceId={selectedService?.id}
            onSelect={(service) => {
              setSelectedService(service);
              setSelectedSlot(undefined);
              setConflictMessage(undefined);
            }}
          />
          {selectedService ? (
            <SlotStep
              slots={slotsQuery.data ?? []}
              isLoading={slotsQuery.isLoading}
              selectedStartsAt={selectedSlot?.startsAt.toISOString()}
              conflictMessage={conflictMessage}
              onSelect={(slot) => {
                setSelectedSlot(slot);
                setConflictMessage(undefined);
              }}
            />
          ) : null}
          {selectedSlot ? (
            <CustomerDetailsStep
              register={form.register}
              errors={fieldErrors}
              isSubmitting={createBookingMutation.isPending}
            />
          ) : null}
        </form>
      )}
    </BookingShell>
  );
}

function BookingShell({
  displayName,
  primaryColor,
  children,
}: {
  displayName: string;
  primaryColor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <main
      className="min-h-dvh bg-background text-foreground"
      style={{ "--public-primary": primaryColor } as React.CSSProperties}
    >
      <section className="mx-auto flex w-full max-w-3xl flex-col px-5 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--public-primary)] text-white">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{displayName}</p>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">
              Agendar horario
            </h1>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function createSlotWindow(): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date();
  startsAt.setUTCHours(0, 0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 14);

  return { startsAt, endsAt };
}
