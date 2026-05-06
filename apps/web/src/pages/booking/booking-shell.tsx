import { CalendarDays } from "lucide-react";

type BookingShellProps = {
  displayName: string;
  primaryColor: string;
  title?: string | undefined;
  children: React.ReactNode;
};

export function BookingShell({
  displayName,
  primaryColor,
  title = "Agendar horario",
  children,
}: BookingShellProps): React.JSX.Element {
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
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
