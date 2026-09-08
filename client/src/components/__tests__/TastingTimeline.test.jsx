import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TastingTimeline from "../TastingTimeline";

const baseProps = {
  loading: false,
  error: "",
  successMessage: "",
  filteredCount: 0,
  tastings: [],
  deletingId: "",
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleFavorite: vi.fn(),
  searchTerm: "",
  onSearchTermChange: vi.fn(),
};

describe("TastingTimeline empty state", () => {
  it("shows a shimmering 'Create your first entry' prompt for a brand-new My Wines list", () => {
    const onCreateFirst = vi.fn();
    render(<TastingTimeline {...baseProps} onCreateFirst={onCreateFirst} />);

    const cta = screen.getByRole("button", { name: /create your first entry/i });
    expect(cta).toBeInTheDocument();
    expect(screen.queryByText(/no entries match/i)).not.toBeInTheDocument();

    fireEvent.click(cta);
    expect(onCreateFirst).toHaveBeenCalled();
  });

  it("still shows the plain filter message when a search has zero matches", () => {
    const onCreateFirst = vi.fn();
    render(
      <TastingTimeline {...baseProps} onCreateFirst={onCreateFirst} searchTerm="rioja" />
    );

    expect(screen.getByText(/no entries match your current filters/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create your first entry/i })
    ).not.toBeInTheDocument();
  });

  it("shows the plain filter message when no onCreateFirst handler is given (e.g. Favorites)", () => {
    render(<TastingTimeline {...baseProps} />);

    expect(screen.getByText(/no entries match your current filters/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create your first entry/i })
    ).not.toBeInTheDocument();
  });
});
