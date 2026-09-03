import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "../FilterBar";

const baseProps = {
  grapes: ["Tempranillo", "Pinot Noir"],
  searchTerm: "",
  ratingFilter: "all",
  grapeFilter: "all",
  favoritesOnly: false,
  onSearchTermChange: vi.fn(),
  onRatingFilterChange: vi.fn(),
  onGrapeFilterChange: vi.fn(),
  onFavoritesOnlyChange: vi.fn(),
};

describe("FilterBar", () => {
  it("lists every grape passed in as a filter option", () => {
    render(<FilterBar {...baseProps} />);
    expect(screen.getByRole("option", { name: "Tempranillo" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pinot Noir" })).toBeInTheDocument();
  });

  it("reports search input changes to the parent", () => {
    const onSearchTermChange = vi.fn();
    render(<FilterBar {...baseProps} onSearchTermChange={onSearchTermChange} />);

    fireEvent.change(screen.getByPlaceholderText(/search wine/i), {
      target: { value: "rioja" },
    });

    expect(onSearchTermChange).toHaveBeenCalledWith("rioja");
  });

  it("reports the favorites-only checkbox toggling", () => {
    const onFavoritesOnlyChange = vi.fn();
    render(<FilterBar {...baseProps} onFavoritesOnlyChange={onFavoritesOnlyChange} />);

    fireEvent.click(screen.getByLabelText(/favorites only/i));

    expect(onFavoritesOnlyChange).toHaveBeenCalledWith(true);
  });
});
