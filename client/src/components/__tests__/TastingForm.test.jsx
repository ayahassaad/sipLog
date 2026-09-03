import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TastingForm from "../TastingForm";
import { initialTastingForm, initialWineForm } from "../../constants";

function renderForm(overrides = {}) {
  const onSubmit = vi.fn((event) => event.preventDefault());
  const props = {
    editingId: "",
    createNewWine: true,
    wines: [],
    wineForm: initialWineForm,
    tastingForm: initialTastingForm,
    moodTags: ["Date night", "Cozy night"],
    submitting: false,
    error: "",
    successMessage: "",
    onSubmit,
    onWineModeChange: vi.fn(),
    onWineChange: vi.fn(),
    onTastingChange: vi.fn(),
    onPhotoUpload: vi.fn(),
    onToggleMoodTag: vi.fn(),
    onCancelEdit: vi.fn(),
    ...overrides,
  };

  render(<TastingForm {...props} />);
  return { onSubmit, ...props };
}

describe("TastingForm", () => {
  it("shows the new-wine fields by default", () => {
    renderForm();
    expect(screen.getByLabelText(/wine name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/producer/i)).toBeInTheDocument();
  });

  it("shows an existing-wine dropdown instead when createNewWine is false", () => {
    renderForm({
      createNewWine: false,
      wines: [{ _id: "wine-1", name: "Rioja", producer: "Riscal", vintage: 2020 }],
    });

    expect(screen.queryByLabelText(/wine name/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rioja - Riscal \(2020\)/)).toBeInTheDocument();
  });

  it("calls onToggleMoodTag when a mood tag is clicked", () => {
    const { onToggleMoodTag } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Date night" }));
    expect(onToggleMoodTag).toHaveBeenCalledWith("Date night");
  });

  it("submits the form", () => {
    const { onSubmit } = renderForm();
    fireEvent.submit(screen.getByRole("button", { name: /save wine/i }).closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
