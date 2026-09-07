import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavBar from "../NavBar";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("NavBar", () => {
  it("shows the logged-in user's name and both nav links", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByText(/hi, ayah/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my journal/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /community/i })).toBeInTheDocument();
  });

  it("calls logout when the log out button is clicked", () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalled();
  });
});
