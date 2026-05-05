import type { UseFormRegister } from "react-hook-form";
import type { CustomerDetailsFormValues } from "./booking-page.js";

type CustomerDetailsStepProps = {
  register: UseFormRegister<CustomerDetailsFormValues>;
  errors: Partial<Record<keyof CustomerDetailsFormValues, string | undefined>>;
  isSubmitting: boolean;
};

export function CustomerDetailsStep({
  register,
  errors,
  isSubmitting,
}: CustomerDetailsStepProps): React.JSX.Element {
  return (
    <section aria-labelledby="customer-step-title" className="space-y-4">
      <h2 id="customer-step-title" className="text-lg font-semibold text-foreground">
        Seus dados
      </h2>
      <div className="grid gap-4">
        <Field label="Nome" error={errors.customerName}>
          <input
            id="customerName"
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground outline-none focus:border-primary"
            autoComplete="name"
            {...register("customerName")}
          />
        </Field>
        <Field label="E-mail" error={errors.customerEmail}>
          <input
            id="customerEmail"
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground outline-none focus:border-primary"
            autoComplete="email"
            inputMode="email"
            {...register("customerEmail")}
          />
        </Field>
        <Field label="Telefone" error={errors.customerPhone}>
          <input
            id="customerPhone"
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground outline-none focus:border-primary"
            autoComplete="tel"
            inputMode="tel"
            {...register("customerPhone")}
          />
        </Field>
        <div className="space-y-2">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border accent-[var(--public-primary)]"
              {...register("privacyAccepted")}
            />
            <span>Aceito a politica de privacidade</span>
          </label>
          {errors.privacyAccepted ? (
            <p className="text-sm text-red-700">{errors.privacyAccepted}</p>
          ) : null}
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-md bg-[var(--public-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
      </button>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}): React.JSX.Element {
  const id =
    label === "Nome" ? "customerName" : label === "E-mail" ? "customerEmail" : "customerPhone";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
