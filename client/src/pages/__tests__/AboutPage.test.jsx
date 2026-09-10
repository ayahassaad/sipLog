import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AboutPage from "../AboutPage";
import { useAuth } from "../../context/useAuth";
import { useConversations } from "../../hooks/useConversations";
import { useNotifications } from "../../hooks/useNotifications";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
// SiteHeader always renders ChatFab/NotificationBell when logged in, both
// of which call their own hooks unconditionally -- mocked here for the
// same reason every other page test mocks them.
vi.mock("../../hooks/useConversations", () => ({
  useConversations: vi.fn(),
}));
vi.mock("../../hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
}

describe("AboutPage", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    useConversations.mockReturnValue({ totalUnread: 0 });
    useNotifications.mockReturnValue({ notifications: [], unreadCount: 0, markAllRead: vi.fn() });
  });

  it("is reachable while logged out and shows the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /about siplog/i })).toBeInTheDocument();
  });

  it("mentions that Safari is not supported", () => {
    renderPage();
    expect(screen.getByText(/safari is not currently supported/i)).toBeInTheDocument();
  });

  it("mentions the Community, Followers and Private visibility choices", () => {
    renderPage();
    expect(
      screen.getByText(/Community, Followers, or Private, as described above/i)
    ).toBeInTheDocument();
  });

  it("links to the feedback email address", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /ayah.assaad@icloud.com/i });
    expect(link).toHaveAttribute("href", "mailto:ayah.assaad@icloud.com");
  });
});
