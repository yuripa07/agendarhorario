import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage.js";

describe("HomePage", () => {
  it("renders the foundation screen", () => {
    render(<HomePage />);

    expect(screen.getByText("agendarhorario.com.br")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Agenda online pronta para desenvolvimento.",
    );
  });
});
