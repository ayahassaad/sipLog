import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SiteHeader from "../SiteHeader";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("SiteHeader", () => {
  it("shows both nav links and the logout button when logged in", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

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
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalled();
  });

  it("shows a log in link instead of log out when logged out", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });
});
