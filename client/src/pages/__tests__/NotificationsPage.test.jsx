import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsPage from "../NotificationsPage";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../context/useAuth";
import { useConversations } from "../../hooks/useConversations";

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

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeNotification(id, overrides = {}) {
  return {
    id,
    type: "favorite",
    actor: { id: `actor-${id}`, name: `Person ${id}`, username: `person${id}` },
    conversationId: null,
    createdAt: "2026-09-09T10:00:00.000Z",
    readAt: null,
    ...overrides,
  };
}

function renderPage() {
  render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>
  );
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    useConversations.mockReturnValue({ totalUnread: 0 });
  });

  it("lists every notification, not just the dropdown's capped few", () => {
    const notifications = [1, 2, 3, 4, 5].map((id) => makeNotification(id));
    useNotifications.mockReturnValue({
      notifications,
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      markAllRead: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Person 1 favorited one of your wines")).toBeInTheDocument();
    expect(screen.getByText("Person 5 favorited one of your wines")).toBeInTheDocument();
  });

  it("marks everything read on arrival", () => {
    const markAllRead = vi.fn();
    useNotifications.mockReturnValue({
      notifications: [],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      markAllRead,
    });

    renderPage();

    expect(markAllRead).toHaveBeenCalled();
  });

  it("shows a Load more button when there's another page, and calls loadMore", () => {
    const loadMore = vi.fn();
    useNotifications.mockReturnValue({
      notifications: [makeNotification(1)],
      loading: false,
      error: "",
      hasMore: true,
      loadMore,
      markAllRead: vi.fn(),
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(loadMore).toHaveBeenCalled();
  });

  it("navigates to the actor's profile when a notification is clicked", () => {
    mockNavigate.mockClear();
    useNotifications.mockReturnValue({
      notifications: [makeNotification(1)],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      markAllRead: vi.fn(),
    });

    renderPage();

    fireEvent.click(screen.getByText("Person 1 favorited one of your wines"));
    expect(mockNavigate).toHaveBeenCalledWith("/users/person1");
  });
});
