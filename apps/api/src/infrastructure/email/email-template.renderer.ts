import { render } from "@react-email/render";
import type { ReactNode } from "react";

export type RenderedEmailTemplate = {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export async function renderEmailTemplate(
  subject: string,
  node: ReactNode,
): Promise<RenderedEmailTemplate> {
  const html = await render(node);
  const text = await render(node, { plainText: true });

  return { subject, html, text };
}
