import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminRoute from "../AdminRoute";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

function renderAdminRoute() {
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Home feed</p>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <p>Admin page</p>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminRoute", () => {
  it("shows a loading message while auth is still resolving", () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    renderAdminRoute();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("redirects a logged-out visitor to login", () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    renderAdminRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects a logged-in non-admin to the home feed", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah", isAdmin: false }, loading: false });

    renderAdminRoute();

    expect(screen.getByText("Home feed")).toBeInTheDocument();
  });

  it("renders the admin page for an admin user", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah", isAdmin: true }, loading: false });

    renderAdminRoute();

    expect(screen.getByText("Admin page")).toBeInTheDocument();
  });
});
