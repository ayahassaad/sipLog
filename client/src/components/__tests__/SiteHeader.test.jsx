import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SiteHeader from "../SiteHeader";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("SiteHeader", () => {
  it("shows both nav links and a burger menu button when logged in, with no bare log out button", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /my journal/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /community/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^log out$/i })).not.toBeInTheDocument();
  });

  it("opens the menu on click and shows My Profile, Settings and Log out", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    // Each item's explicit role="menuitem" (standard for a dropdown menu)
    // overrides its implicit link/button role, so that's what to query by.
    expect(screen.getByRole("menuitem", { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^log out$/i })).toBeInTheDocument();
  });

  it("links the Messages item to /chat", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("menuitem", { name: /messages/i })).toHaveAttribute("href", "/chat");
  });

  it("calls logout and closes the menu when Log out is clicked", () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /^log out$/i }));

    expect(logout).toHaveBeenCalled();
    expect(screen.queryByRole("menuitem", { name: /^log out$/i })).not.toBeInTheDocument();
  });

  it("does not show an Admin link for a regular user", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah", isAdmin: false }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.queryByRole("menuitem", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("shows an Admin link in the menu for an admin user", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah", isAdmin: true }, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("menuitem", { name: /admin/i })).toBeInTheDocument();
  });

  it("shows a log in link and no burger menu when logged out", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument();
  });
});
