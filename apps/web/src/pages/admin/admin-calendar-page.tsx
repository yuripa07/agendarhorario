import type { AdminCalendarAppointment } from "@agendarhorario/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isUnauthorized, listAdminCalendarAppointments } from "./admin-client.js";
import { AdminShell, navigateTo } from "./admin-shell.js";

type CalendarMode = "day" | "week";

export function AdminCalendarPage(): React.JSX.Element {
  const [mode, setMode] = useState<CalendarMode>("day");
  const [selectedDate, setSelectedDate] = useState(readInitialDate);
  const windowRange = useMemo(() => createCalendarWindow(selectedDate, mode), [selectedDate, mode]);

  const appointmentsQuery = useQuery({
    queryKey: ["admin", "calendar", mode, windowRange.startsAt, windowRange.endsAt],
    queryFn: () => listAdminCalendarAppointments(windowRange),
    retry: false,
  });

  useEffect(() => {
    if (appointmentsQuery.isError && isUnauthorized(appointmentsQuery.error)) {
      navigateTo("/admin/login");
    }
  }, [appointmentsQuery.error, appointmentsQuery.isError]);

  const appointments = appointmentsQuery.data ?? [];
  const hasGenericError = appointmentsQuery.isError && !isUnauthorized(appointmentsQuery.error);

  return (
    <AdminShell title="Agenda" genericError={hasGenericError}>
      <CalendarToolbar
        mode={mode}
        selectedDate={selectedDate}
        onModeChange={setMode}
        onPrevious={() => setSelectedDate(addUtcDays(selectedDate, mode === "day" ? -1 : -7))}
        onToday={() => setSelectedDate(startOfUtcDay(new Date()))}
        onNext={() => setSelectedDate(addUtcDays(selectedDate, mode === "day" ? 1 : 7))}
      />

      {appointmentsQuery.isLoading ? (
        <div className="mt-5 rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando agenda...
        </div>
      ) : mode === "day" ? (
        <DayCalendar appointments={appointments} />
      ) : (
        <WeekCalendar appointments={appointments} weekStart={startOfUtcWeek(selectedDate)} />
      )}
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
}: {
  mode: CalendarMode;
  selectedDate: Date;
  onModeChange: (mode: CalendarMode) => void;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
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
}: {
  appointments: readonly AdminCalendarAppointment[];
}): React.JSX.Element {
  if (appointments.length === 0) {
    return <EmptyCalendar />;
  }

  return (
    <section aria-label="Agenda do dia" className="mt-5 grid gap-3">
      {sortAppointments(appointments).map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </section>
  );
}

function WeekCalendar({
  appointments,
  weekStart,
}: {
  appointments: readonly AdminCalendarAppointment[];
  weekStart: Date;
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
                  <AppointmentCard key={appointment.id} appointment={appointment} compact />
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
}: {
  appointment: AdminCalendarAppointment;
  compact?: boolean;
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
    </article>
  );
}

function EmptyCalendar(): React.JSX.Element {
  return (
    <section className="mt-5 rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
      Nenhum agendamento nesse periodo.
    </section>
  );
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
