import React from "react";

const styles = {
  body: {
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
    lineHeight: "1.5",
  },
  title: {
    color: "#111827",
    fontSize: "20px",
    margin: "0 0 16px",
  },
  paragraph: {
    margin: "0 0 12px",
  },
  link: {
    color: "#2563eb",
  },
};

export type PasswordResetEmailTemplateInput = {
  readonly resetUrl: string;
};

export type BookingEmailTemplateInput = {
  readonly customerName: string;
  readonly serviceName?: string;
  readonly startsAt: Date;
  readonly timezone: string;
};

export type BookingCreatedEmailTemplateInput = BookingEmailTemplateInput & {
  readonly managementUrl: string;
};

export function passwordResetEmail(input: PasswordResetEmailTemplateInput) {
  const subject = "Redefinicao de senha";

  return {
    subject,
    node: layout([
      heading(subject),
      paragraph("Recebemos uma solicitacao para redefinir sua senha."),
      paragraph("Use o link abaixo para escolher uma nova senha. O link expira em 1 hora."),
      paragraph(link(input.resetUrl, "Redefinir senha")),
    ]),
  };
}

export function bookingCreatedEmail(input: BookingCreatedEmailTemplateInput) {
  const subject = "Agendamento confirmado";
  const service = serviceLine(input.serviceName);
  const scheduledFor = formatDateTime(input.startsAt, input.timezone);

  return {
    subject,
    node: layout([
      heading(subject),
      paragraph(`Ola, ${input.customerName}. Seu agendamento foi confirmado.`),
      paragraph(`Horario: ${scheduledFor}`),
      service ? paragraph(service) : null,
      paragraph(link(input.managementUrl, "Gerenciar agendamento")),
    ]),
  };
}

export function bookingCanceledEmail(input: BookingEmailTemplateInput) {
  const subject = "Agendamento cancelado";
  const service = serviceLine(input.serviceName);
  const scheduledFor = formatDateTime(input.startsAt, input.timezone);

  return {
    subject,
    node: layout([
      heading(subject),
      paragraph(`Ola, ${input.customerName}. Seu agendamento foi cancelado.`),
      paragraph(`Horario cancelado: ${scheduledFor}`),
      service ? paragraph(service) : null,
    ]),
  };
}

export function bookingRescheduledEmail(input: BookingEmailTemplateInput) {
  const subject = "Agendamento remarcado";
  const service = serviceLine(input.serviceName);
  const scheduledFor = formatDateTime(input.startsAt, input.timezone);

  return {
    subject,
    node: layout([
      heading(subject),
      paragraph(`Ola, ${input.customerName}. Seu agendamento foi remarcado.`),
      paragraph(`Novo horario: ${scheduledFor}`),
      service ? paragraph(service) : null,
    ]),
  };
}

function layout(children: Array<React.ReactNode | null>) {
  return React.createElement(
    "html",
    null,
    React.createElement(
      "body",
      { style: styles.body },
      children
        .filter((child): child is React.ReactNode => child !== null)
        .map((child, index) => React.createElement(React.Fragment, { key: index }, child)),
    ),
  );
}

function heading(text: string) {
  return React.createElement("h1", { style: styles.title }, text);
}

function paragraph(child: React.ReactNode) {
  return React.createElement("p", { style: styles.paragraph }, child);
}

function link(href: string, text: string) {
  return React.createElement("a", { href, style: styles.link }, text);
}

function serviceLine(serviceName: string | undefined): string | undefined {
  return serviceName ? `Servico: ${serviceName}` : undefined;
}

function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}
