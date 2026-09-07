import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TastingForm from "../TastingForm";
import { initialTastingForm, initialWineForm } from "../../constants";

function renderForm(overrides = {}) {
  const onSubmit = vi.fn((event) => event.preventDefault());
  const props = {
    editingId: "",
    wineForm: initialWineForm,
    tastingForm: initialTastingForm,
    submitting: false,
    error: "",
    successMessage: "",
    onSubmit,
    onWineChange: vi.fn(),
    onTastingChange: vi.fn(),
    onPhotoUpload: vi.fn(),
    onCancelEdit: vi.fn(),
    ...overrides,
  };

  render(<TastingForm {...props} />);
  return { onSubmit, ...props };
}

describe("TastingForm", () => {
  it("always shows the editable wine fields when adding a wine", () => {
    renderForm();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/producer/i)).toBeInTheDocument();
  });

  it("pre-fills the wine fields (still editable, no dropdown) when editing a tasting", () => {
    renderForm({
      editingId: "tasting-1",
      wineForm: {
        name: "Rioja",
        producer: "Riscal",
        country: "Spain",
        region: "Rioja",
        grape: "Tempranillo",
        vintage: 2020,
      },
    });

    expect(screen.queryByRole("combobox", { name: /select a wine/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Rioja");
    expect(screen.getByLabelText(/producer/i)).toHaveValue("Riscal");
  });

  it("submits the form", () => {
    const { onSubmit } = renderForm();
    fireEvent.submit(screen.getByRole("button", { name: /save wine/i }).closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
