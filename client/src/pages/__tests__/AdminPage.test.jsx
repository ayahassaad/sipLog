import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminPage from "../AdminPage";
import { useAuth } from "../../context/useAuth";
import { useAdminUsers } from "../../hooks/useAdminUsers";
import { useAdminStats } from "../../hooks/useAdminStats";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../hooks/useAdminUsers", () => ({
  useAdminUsers: vi.fn(),
}));
vi.mock("../../hooks/useAdminStats", () => ({
  useAdminStats: vi.fn(),
}));

const sampleStats = {
  totalUsers: 12,
  totalVisits: 340,
  totalWines: 8,
  totalTastings: 20,
  newUsersThisWeek: 3,
  newUsersThisMonth: 5,
  topByFollowers: [
    { id: "bob-id", name: "Bob", username: "bob", avatarUrl: "", followersCount: 4 },
  ],
  topByTastings: [
    { id: "carla-id", name: "Carla", username: "carla", avatarUrl: "", tastingsCount: 9 },
  ],
};

const baseAdminUsers = {
  users: [],
  loading: false,
  searching: false,
  error: "",
  search: "",
  hasMore: false,
  loadMore: vi.fn(),
  runSearch: vi.fn(),
  toggleAdmin: vi.fn(),
};

function renderPage() {
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>
  );
}

describe("AdminPage stats", () => {
  it("shows the stat tiles and both leaderboards, linking to each person's profile", () => {
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue(baseAdminUsers);

    renderPage();

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /@bob/i })).toHaveAttribute("href", "/users/bob");
    expect(screen.getByText(/4 followers/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /@carla/i })).toHaveAttribute(
      "href",
      "/users/carla"
    );
    expect(screen.getByText(/9 tastings/i)).toBeInTheDocument();
  });

  it("shows a loading message for stats while they're still loading", () => {
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: null, loading: true, error: "" });
    useAdminUsers.mockReturnValue(baseAdminUsers);

    renderPage();

    expect(screen.getByText(/loading site stats/i)).toBeInTheDocument();
  });
});

describe("AdminPage user directory", () => {
  const bob = {
    id: "bob-id",
    name: "Bob",
    username: "bob",
    avatarUrl: "",
    isAdmin: false,
    isSuperAdmin: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("lets the super admin grant admin access from the directory", () => {
    const toggleAdmin = vi.fn();
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({ ...baseAdminUsers, users: [bob], toggleAdmin });

    renderPage();

    const button = screen.getByRole("button", { name: /make admin/i });
    fireEvent.click(button);

    expect(toggleAdmin).toHaveBeenCalledWith("bob-id", false);
  });

  it("shows Remove Admin for someone who's already an admin", () => {
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({
      ...baseAdminUsers,
      users: [{ ...bob, isAdmin: true }],
    });

    renderPage();

    expect(screen.getByRole("button", { name: /remove admin/i })).toBeInTheDocument();
  });

  it("hides the toggle button for a non-super-admin viewer, showing a badge instead", () => {
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: false, isAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({
      ...baseAdminUsers,
      users: [{ ...bob, isAdmin: true }],
    });

    renderPage();

    expect(screen.queryByRole("button", { name: /remove admin/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^admin$/i)).toBeInTheDocument();
  });

  it("shows a Super Admin badge (no toggle) for the super admin account itself", () => {
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({
      ...baseAdminUsers,
      users: [{ ...bob, isSuperAdmin: true, isAdmin: true }],
    });

    renderPage();

    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("hides the toggle button next to your own row", () => {
    useAuth.mockReturnValue({ user: { id: "bob-id", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({ ...baseAdminUsers, users: [bob] });

    renderPage();

    expect(screen.queryByRole("button", { name: /make admin/i })).not.toBeInTheDocument();
  });

  it("debounces the search box before calling runSearch", () => {
    vi.useFakeTimers();
    const runSearch = vi.fn();
    useAuth.mockReturnValue({ user: { id: "me", isSuperAdmin: true } });
    useAdminStats.mockReturnValue({ stats: sampleStats, loading: false, error: "" });
    useAdminUsers.mockReturnValue({ ...baseAdminUsers, runSearch });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/search users by name or username/i), {
      target: { value: "bob" },
    });

    expect(runSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(runSearch).toHaveBeenCalledWith("bob");

    vi.useRealTimers();
  });
});
