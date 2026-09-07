import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SiteHeader from "../SiteHeader";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("SiteHeader", () => {
  it("shows both nav links and the logout button", () => {
    useAuth.mockReturnValue({ logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /my journal/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /community/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("calls logout when the log out button is clicked", () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ logout });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalled();
  });
});
