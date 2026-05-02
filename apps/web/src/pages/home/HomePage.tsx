import { CalendarDays } from "lucide-react";

export function HomePage(): React.JSX.Element {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span className="flex size-10 items-center justify-center rounded-md border border-border bg-card">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <span>agendarhorario.com.br</span>
        </div>
        <div className="mt-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Agenda online pronta para desenvolvimento.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Fundação do app carregada com React, Vite, TanStack Router, TanStack Query, Tailwind CSS
            e shadcn/ui.
          </p>
        </div>
      </section>
    </main>
  );
}
