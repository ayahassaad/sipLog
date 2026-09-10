import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

describe("TastingTimeline author link (Favorites tab)", () => {
  const favoritedTasting = {
    _id: "tasting-1",
    rating: 4,
    appearance: "Deep ruby",
    noseNotes: ["cherry"],
    palateNotes: ["oak"],
    sweetness: 2,
    acidity: 3,
    body: 4,
    tannin: 3,
    wineId: {
      name: "Rioja Reserva",
      producer: "Bodega Test",
      grape: "Tempranillo",
      country: "Spain",
      vintage: 2018,
    },
    userId: { _id: "bob-id", username: "bob" },
  };

  it("links 'Tasted by: @username' to that person's public profile", () => {
    render(
      <MemoryRouter>
        <TastingTimeline
          {...baseProps}
          filteredCount={1}
          tastings={[favoritedTasting]}
          showAuthor
        />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "@bob" });
    expect(link).toHaveAttribute("href", "/users/bob");
  });
});

describe("TastingTimeline keyboard navigation", () => {
  const tastingAt = (index) => ({
    _id: `tasting-${index}`,
    rating: 4,
    appearance: "Deep ruby",
    noseNotes: [],
    palateNotes: [],
    sweetness: 2,
    acidity: 3,
    body: 4,
    tannin: 3,
    wineId: {
      name: `Wine ${index}`,
      producer: "Bodega Test",
      grape: "Tempranillo",
      country: "Spain",
      vintage: 2018,
    },
  });

  it("moves to the next and previous card with the arrow keys", () => {
    const tastings = [tastingAt(0), tastingAt(1), tastingAt(2)];
    render(<TastingTimeline {...baseProps} filteredCount={3} tastings={tastings} />);

    const dots = screen.getAllByRole("button", { name: /go to/i });
    expect(dots[0]).toHaveClass("is-active");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(dots[1]).toHaveClass("is-active");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(dots[0]).toHaveClass("is-active");
  });

  it("ignores arrow keys while typing in the search box", () => {
    const tastings = [tastingAt(0), tastingAt(1)];
    render(<TastingTimeline {...baseProps} filteredCount={2} tastings={tastings} />);

    const searchInput = screen.getByPlaceholderText(/search wine/i);
    fireEvent.keyDown(searchInput, { key: "ArrowRight" });

    const dots = screen.getAllByRole("button", { name: /go to/i });
    expect(dots[0]).toHaveClass("is-active");
  });
});
