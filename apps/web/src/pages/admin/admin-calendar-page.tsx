import type { AdminCalendarAppointment, AdminCalendarSlot, Service } from "@agendarhorario/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ChevronLeft, ChevronRight, Mail, Phone, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  cancelAdminAppointment,
  createAdminAppointment,
  isUnauthorized,
  listAdminCalendarAppointments,
  listAdminCalendarSlots,
  listAdminServices,
  rescheduleAdminAppointment,
} from "./admin-client.js";
import { AdminShell, navigateTo } from "./admin-shell.js";

type CalendarMode = "day" | "week";

type CreateAppointmentForm = {
  isOpen: boolean;
  serviceId: string;
  date: string;
  selectedStartsAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

type RescheduleAppointmentForm = {
  appointment: AdminCalendarAppointment;
  date: string;
  selectedStartsAt: string;
};

export function AdminCalendarPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CalendarMode>("day");
  const [selectedDate, setSelectedDate] = useState(readInitialDate);
  const [createForm, setCreateForm] = useState<CreateAppointmentForm>(() =>
    createEmptyAppointmentForm(selectedDate),
  );
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleAppointmentForm | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<AdminCalendarAppointment | null>(
    null,
  );
  const windowRange = useMemo(() => createCalendarWindow(selectedDate, mode), [selectedDate, mode]);
  const activeSlotRequest = rescheduleForm
    ? {
        serviceId: rescheduleForm.appointment.serviceId,
        date: rescheduleForm.date,
      }
    : createForm.isOpen && createForm.serviceId
      ? {
          serviceId: createForm.serviceId,
          date: createForm.date,
        }
      : null;
  const slotWindow = useMemo(
    () => (activeSlotRequest ? createUtcDateWindow(activeSlotRequest.date) : null),
    [activeSlotRequest],
  );

  const appointmentsQuery = useQuery({
    queryKey: ["admin", "calendar", mode, windowRange.startsAt, windowRange.endsAt],
    queryFn: () => listAdminCalendarAppointments(windowRange),
    retry: false,
  });
  const servicesQuery = useQuery({
    queryKey: ["admin", "services"],
    queryFn: listAdminServices,
    enabled: createForm.isOpen,
    retry: false,
  });
  const slotsQuery = useQuery({
    queryKey: [
      "admin",
      "calendar",
      "slots",
      activeSlotRequest?.serviceId,
      slotWindow?.startsAt,
      slotWindow?.endsAt,
    ],
    queryFn: () =>
      listAdminCalendarSlots({
        serviceId: requireValue(activeSlotRequest).serviceId,
        query: requireValue(slotWindow),
      }),
    enabled: Boolean(activeSlotRequest && slotWindow),
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: createAdminAppointment,
    onSuccess: async () => {
      setCreateForm(createEmptyAppointmentForm(selectedDate));
      await queryClient.invalidateQueries({ queryKey: ["admin", "calendar"] });
    },
  });
  const rescheduleMutation = useMutation({
    mutationFn: rescheduleAdminAppointment,
    onSuccess: async () => {
      setRescheduleForm(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "calendar"] });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: cancelAdminAppointment,
    onSuccess: async () => {
      setAppointmentToCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "calendar"] });
    },
  });

  useEffect(() => {
    const unauthorizedError = [
      appointmentsQuery.error,
      servicesQuery.error,
      slotsQuery.error,
      createMutation.error,
      rescheduleMutation.error,
      cancelMutation.error,
    ].find(isUnauthorized);

    if (unauthorizedError) {
      navigateTo("/admin/login");
    }
  }, [
    appointmentsQuery.error,
    servicesQuery.error,
    slotsQuery.error,
    createMutation.error,
    rescheduleMutation.error,
    cancelMutation.error,
  ]);

  useEffect(() => {
    const firstActiveService = (servicesQuery.data ?? []).find((service) => service.isActive);

    if (createForm.isOpen && !createForm.serviceId && firstActiveService) {
      setCreateForm((current) => ({ ...current, serviceId: firstActiveService.id }));
    }
  }, [createForm.isOpen, createForm.serviceId, servicesQuery.data]);

  const appointments = appointmentsQuery.data ?? [];
  const activeServices = (servicesQuery.data ?? []).filter((service) => service.isActive);
  const hasGenericError =
    (appointmentsQuery.isError && !isUnauthorized(appointmentsQuery.error)) ||
    (servicesQuery.isError && !isUnauthorized(servicesQuery.error)) ||
    (slotsQuery.isError && !isUnauthorized(slotsQuery.error)) ||
    createMutation.isError ||
    rescheduleMutation.isError ||
    cancelMutation.isError;

  function openCreateModal(): void {
    setCreateForm({ ...createEmptyAppointmentForm(selectedDate), isOpen: true });
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!createForm.selectedStartsAt) {
      return;
    }

    createMutation.mutate({
      serviceId: createForm.serviceId,
      startsAt: new Date(createForm.selectedStartsAt),
      customerName: createForm.customerName,
      customerEmail: createForm.customerEmail,
      customerPhone: createForm.customerPhone,
    });
  }

  function submitReschedule(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!rescheduleForm?.selectedStartsAt) {
      return;
    }

    rescheduleMutation.mutate({
      id: rescheduleForm.appointment.id,
      data: { startsAt: new Date(rescheduleForm.selectedStartsAt) },
    });
  }

  return (
    <AdminShell title="Agenda" genericError={hasGenericError}>
      <CalendarToolbar
        mode={mode}
        selectedDate={selectedDate}
        onModeChange={setMode}
        onPrevious={() => setSelectedDate(addUtcDays(selectedDate, mode === "day" ? -1 : -7))}
        onToday={() => setSelectedDate(startOfUtcDay(new Date()))}
        onNext={() => setSelectedDate(addUtcDays(selectedDate, mode === "day" ? 1 : 7))}
        onCreate={openCreateModal}
      />

      {appointmentsQuery.isLoading ? (
        <div className="mt-5 rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando agenda...
        </div>
      ) : mode === "day" ? (
        <DayCalendar
          appointments={appointments}
          onReschedule={(appointment) =>
            setRescheduleForm(createRescheduleForm(appointment, selectedDate))
          }
          onCancel={setAppointmentToCancel}
        />
      ) : (
        <WeekCalendar
          appointments={appointments}
          weekStart={startOfUtcWeek(selectedDate)}
          onReschedule={(appointment) =>
            setRescheduleForm(createRescheduleForm(appointment, selectedDate))
          }
          onCancel={setAppointmentToCancel}
        />
      )}

      {createForm.isOpen ? (
        <AppointmentDialog
          title="Novo agendamento"
          onClose={() => setCreateForm(createEmptyAppointmentForm(selectedDate))}
        >
          <AppointmentCreateForm
            form={createForm}
            activeServices={activeServices}
            slots={slotsQuery.data ?? []}
            isLoadingServices={servicesQuery.isLoading}
            isLoadingSlots={slotsQuery.isLoading}
            isSubmitting={createMutation.isPending}
            onChange={setCreateForm}
            onSubmit={submitCreate}
          />
        </AppointmentDialog>
      ) : null}

      {rescheduleForm ? (
        <AppointmentDialog title="Remarcar agendamento" onClose={() => setRescheduleForm(null)}>
          <AppointmentRescheduleForm
            form={rescheduleForm}
            slots={slotsQuery.data ?? []}
            isLoadingSlots={slotsQuery.isLoading}
            isSubmitting={rescheduleMutation.isPending}
            onChange={setRescheduleForm}
            onSubmit={submitReschedule}
          />
        </AppointmentDialog>
      ) : null}

      {appointmentToCancel ? (
        <AppointmentDialog
          title="Cancelar agendamento"
          onClose={() => setAppointmentToCancel(null)}
        >
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Cancelar o agendamento de {appointmentToCancel.customerName} em{" "}
              {formatFullDate(appointmentToCancel.startsAt)} as{" "}
              {formatTime(appointmentToCancel.startsAt)}?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cancelMutation.mutate(appointmentToCancel.id)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white"
              >
                <X className="size-4" aria-hidden="true" />
                Cancelar agendamento
              </button>
              <button
                type="button"
                onClick={() => setAppointmentToCancel(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </AppointmentDialog>
      ) : null}
    </AdminShell>
  );
}

function CalendarToolbar({
  mode,
  selectedDate,
  onModeChange,
  onPrevious,
  onToday,
  onNext,
  onCreate,
}: {
  mode: CalendarMode;
  selectedDate: Date;
  onModeChange: (mode: CalendarMode) => void;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onCreate: () => void;
}): React.JSX.Element {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {mode === "day" ? "Visao diaria" : "Visao semanal"}
          </p>
          <h2 className="text-lg font-semibold text-card-foreground">
            {mode === "day" ? formatFullDate(selectedDate) : formatWeekRange(selectedDate)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Novo agendamento
          </button>
          <div className="grid grid-cols-2 rounded-md border border-border bg-background p-1">
            <button
              type="button"
              aria-pressed={mode === "day"}
              onClick={() => onModeChange("day")}
              className="min-h-9 rounded px-3 text-sm font-semibold text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              Dia
            </button>
            <button
              type="button"
              aria-pressed={mode === "week"}
              onClick={() => onModeChange("week")}
              className="min-h-9 rounded px-3 text-sm font-semibold text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              Semana
            </button>
          </div>
          <button
            type="button"
            aria-label="Anterior"
            onClick={onPrevious}
            className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Proximo"
            onClick={onNext}
            className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function DayCalendar({
  appointments,
  onReschedule,
  onCancel,
}: {
  appointments: readonly AdminCalendarAppointment[];
  onReschedule: (appointment: AdminCalendarAppointment) => void;
  onCancel: (appointment: AdminCalendarAppointment) => void;
}): React.JSX.Element {
  if (appointments.length === 0) {
    return <EmptyCalendar />;
  }

  return (
    <section aria-label="Agenda do dia" className="mt-5 grid gap-3">
      {sortAppointments(appointments).map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onReschedule={onReschedule}
          onCancel={onCancel}
        />
      ))}
    </section>
  );
}

function WeekCalendar({
  appointments,
  weekStart,
  onReschedule,
  onCancel,
}: {
  appointments: readonly AdminCalendarAppointment[];
  weekStart: Date;
  onReschedule: (appointment: AdminCalendarAppointment) => void;
  onCancel: (appointment: AdminCalendarAppointment) => void;
}): React.JSX.Element {
  const days = Array.from({ length: 7 }, (_, index) => addUtcDays(weekStart, index));

  return (
    <section aria-label="Agenda da semana" className="mt-5 grid gap-4 lg:grid-cols-7">
      {days.map((day) => {
        const dayAppointments = appointments.filter(
          (appointment) => startOfUtcDay(appointment.startsAt).getTime() === day.getTime(),
        );

        return (
          <div key={day.toISOString()} className="rounded-md border border-border bg-card p-3">
            <h2 className="text-base font-semibold text-card-foreground">{formatWeekday(day)}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{formatShortDate(day)}</p>
            {dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem agendamentos.</p>
            ) : (
              <div className="grid gap-3">
                {sortAppointments(dayAppointments).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    compact
                    onReschedule={onReschedule}
                    onCancel={onCancel}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function AppointmentCard({
  appointment,
  compact = false,
  onReschedule,
  onCancel,
}: {
  appointment: AdminCalendarAppointment;
  compact?: boolean;
  onReschedule: (appointment: AdminCalendarAppointment) => void;
  onCancel: (appointment: AdminCalendarAppointment) => void;
}): React.JSX.Element {
  const isCanceled = appointment.status === "canceled";

  return (
    <article
      className={`rounded-md border p-4 ${
        isCanceled ? "border-red-200 bg-red-50 text-red-950" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">
            {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}
          </p>
          <h3 className="text-base font-semibold text-card-foreground">
            {appointment.customerName}
          </h3>
          <p className="text-sm text-muted-foreground">{appointment.serviceName}</p>
        </div>
        <span className="w-fit rounded-md bg-muted px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
          {isCanceled ? "Cancelado" : "Confirmado"}
        </span>
      </div>
      {!compact ? (
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4" aria-hidden="true" />
            {appointment.customerEmail}
          </span>
          <span className="inline-flex items-center gap-2">
            <Phone className="size-4" aria-hidden="true" />
            {appointment.customerPhone}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{appointment.customerPhone}</p>
      )}
      {!isCanceled ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onReschedule(appointment)}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted"
          >
            Remarcar
          </button>
          <button
            type="button"
            onClick={() => onCancel(appointment)}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </article>
  );
}

function AppointmentDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <section
        aria-label={title}
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-md border border-border bg-card p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AppointmentCreateForm({
  form,
  activeServices,
  slots,
  isLoadingServices,
  isLoadingSlots,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  form: CreateAppointmentForm;
  activeServices: readonly Service[];
  slots: readonly AdminCalendarSlot[];
  isLoadingServices: boolean;
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  onChange: (form: CreateAppointmentForm) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}): React.JSX.Element {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Servico
          <select
            value={form.serviceId}
            onChange={(event) =>
              onChange({ ...form, serviceId: event.target.value, selectedStartsAt: "" })
            }
            className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
            required
          >
            {isLoadingServices ? <option value="">Carregando...</option> : null}
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.durationMinutes} min
              </option>
            ))}
          </select>
        </label>
        <DateField
          value={form.date}
          onChange={(date) => onChange({ ...form, date, selectedStartsAt: "" })}
        />
      </div>
      <SlotPicker
        slots={slots}
        selectedStartsAt={form.selectedStartsAt}
        isLoading={isLoadingSlots}
        onChange={(selectedStartsAt) => onChange({ ...form, selectedStartsAt })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Nome
          <input
            value={form.customerName}
            onChange={(event) => onChange({ ...form, customerName: event.target.value })}
            className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Telefone
          <input
            value={form.customerPhone}
            onChange={(event) => onChange({ ...form, customerPhone: event.target.value })}
            className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
            required
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        E-mail
        <input
          type="email"
          value={form.customerEmail}
          onChange={(event) => onChange({ ...form, customerEmail: event.target.value })}
          className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
          required
        />
      </label>
      <SubmitButton disabled={!form.selectedStartsAt || isSubmitting}>
        Criar agendamento
      </SubmitButton>
    </form>
  );
}

function AppointmentRescheduleForm({
  form,
  slots,
  isLoadingSlots,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  form: RescheduleAppointmentForm;
  slots: readonly AdminCalendarSlot[];
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  onChange: (form: RescheduleAppointmentForm) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}): React.JSX.Element {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-md border border-border bg-background p-3">
        <p className="text-sm font-semibold">{form.appointment.customerName}</p>
        <p className="text-sm text-muted-foreground">{form.appointment.serviceName}</p>
      </div>
      <DateField
        value={form.date}
        onChange={(date) => onChange({ ...form, date, selectedStartsAt: "" })}
      />
      <SlotPicker
        slots={slots}
        selectedStartsAt={form.selectedStartsAt}
        isLoading={isLoadingSlots}
        onChange={(selectedStartsAt) => onChange({ ...form, selectedStartsAt })}
      />
      <SubmitButton disabled={!form.selectedStartsAt || isSubmitting}>
        Salvar remarcacao
      </SubmitButton>
    </form>
  );
}

function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <label className="grid gap-2 text-sm font-medium">
      Data
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border bg-background px-3 text-sm"
        required
      />
    </label>
  );
}

function SlotPicker({
  slots,
  selectedStartsAt,
  isLoading,
  onChange,
}: {
  slots: readonly AdminCalendarSlot[];
  selectedStartsAt: string;
  isLoading: boolean;
  onChange: (value: string) => void;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
        Carregando horarios...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
        Nenhum horario disponivel nessa data.
      </div>
    );
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Horario</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => {
          const value = slot.startsAt.toISOString();
          return (
            <label
              key={value}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
            >
              <input
                type="radio"
                name="admin-calendar-slot"
                value={value}
                checked={selectedStartsAt === value}
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
              />
              {formatTime(slot.startsAt)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function EmptyCalendar(): React.JSX.Element {
  return (
    <section className="mt-5 rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
      Nenhum agendamento nesse periodo.
    </section>
  );
}

function createEmptyAppointmentForm(selectedDate: Date): CreateAppointmentForm {
  return {
    isOpen: false,
    serviceId: "",
    date: formatDateInput(selectedDate),
    selectedStartsAt: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  };
}

function createRescheduleForm(
  appointment: AdminCalendarAppointment,
  selectedDate: Date,
): RescheduleAppointmentForm {
  return {
    appointment,
    date: formatDateInput(selectedDate),
    selectedStartsAt: "",
  };
}

function createCalendarWindow(
  selectedDate: Date,
  mode: CalendarMode,
): {
  startsAt: Date;
  endsAt: Date;
} {
  const startsAt = mode === "day" ? startOfUtcDay(selectedDate) : startOfUtcWeek(selectedDate);
  const endsAt = addUtcDays(startsAt, mode === "day" ? 1 : 7);

  return { startsAt, endsAt };
}

function createUtcDateWindow(value: string): {
  startsAt: Date;
  endsAt: Date;
} {
  const startsAt = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(startsAt.getTime())) {
    return createCalendarWindow(startOfUtcDay(new Date()), "day");
  }

  return {
    startsAt,
    endsAt: addUtcDays(startsAt, 1),
  };
}

function startOfUtcDay(value: Date): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function startOfUtcWeek(value: Date): Date {
  const date = startOfUtcDay(value);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return addUtcDays(date, -daysFromMonday);
}

function addUtcDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function sortAppointments(
  appointments: readonly AdminCalendarAppointment[],
): readonly AdminCalendarAppointment[] {
  return [...appointments].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );
}

function formatFullDate(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(value);
}

function formatWeekRange(value: Date): string {
  const startsAt = startOfUtcWeek(value);
  const endsAt = addUtcDays(startsAt, 6);
  return `${formatShortDate(startsAt)} - ${formatShortDate(endsAt)}`;
}

function formatWeekday(value: Date): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatShortDate(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

function formatDateInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function requireValue<T>(value: T | null | undefined): T {
  if (!value) {
    throw new Error("Expected value");
  }

  return value;
}

function readInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get("date");

  if (!dateParam) {
    return startOfUtcDay(new Date());
  }

  const parsed = new Date(`${dateParam}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfUtcDay(new Date());
  }

  return parsed;
}
