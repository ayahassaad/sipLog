import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "../FilterBar";

const baseProps = {
  searchTerm: "",
  onSearchTermChange: vi.fn(),
};

describe("FilterBar", () => {
  it("reports search input changes to the parent", () => {
    const onSearchTermChange = vi.fn();
    render(<FilterBar {...baseProps} onSearchTermChange={onSearchTermChange} />);

    fireEvent.change(screen.getByPlaceholderText(/search wine/i), {
      target: { value: "rioja" },
    });

    expect(onSearchTermChange).toHaveBeenCalledWith("rioja");
  });
});
