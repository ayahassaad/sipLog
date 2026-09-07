import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TastingForm from "../TastingForm";
import { initialTastingForm, initialWineForm } from "../../constants";

function renderForm(overrides = {}) {
  const onSubmit = vi.fn((event) => event.preventDefault());
  const props = {
    editingId: "",
    wines: [],
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
  it("always shows the new-wine fields when adding a wine", () => {
    renderForm();
    expect(screen.getByLabelText(/wine name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/producer/i)).toBeInTheDocument();
  });

  it("shows an existing-wine dropdown instead when editing a tasting", () => {
    renderForm({
      editingId: "tasting-1",
      wines: [{ _id: "wine-1", name: "Rioja", producer: "Riscal", vintage: 2020 }],
    });

    expect(screen.queryByLabelText(/wine name/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rioja - Riscal \(2020\)/)).toBeInTheDocument();
  });

  it("submits the form", () => {
    const { onSubmit } = renderForm();
    fireEvent.submit(screen.getByRole("button", { name: /save wine/i }).closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
