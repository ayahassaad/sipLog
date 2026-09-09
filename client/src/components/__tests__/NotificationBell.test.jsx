import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NotificationBell from "../NotificationBell";
import { useNotifications } from "../../hooks/useNotifications";

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
    type: "follow",
    actor: { id: `actor-${id}`, name: `Person ${id}`, username: `person${id}` },
    conversationId: null,
    createdAt: "2026-09-09T10:00:00.000Z",
    readAt: "2026-09-09T10:01:00.000Z",
    ...overrides,
  };
}

function renderBell() {
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

describe("NotificationBell", () => {
  it("shows only the 4 most recent notifications in the dropdown", () => {
    const notifications = [1, 2, 3, 4, 5, 6].map((id) => makeNotification(id));
    useNotifications.mockReturnValue({ notifications, unreadCount: 0, markAllRead: vi.fn() });

    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(screen.getAllByRole("menuitem")).toHaveLength(5); // 4 notifications + "View all"
    expect(screen.getByText("Person 1 started following you")).toBeInTheDocument();
    expect(screen.getByText("Person 4 started following you")).toBeInTheDocument();
    expect(screen.queryByText("Person 5 started following you")).not.toBeInTheDocument();
  });

  it("navigates to the full notification history from View all", () => {
    mockNavigate.mockClear();
    const notifications = [makeNotification(1)];
    useNotifications.mockReturnValue({ notifications, unreadCount: 0, markAllRead: vi.fn() });

    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /view all notifications/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/notifications");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks everything read the moment the dropdown opens", () => {
    const markAllRead = vi.fn();
    useNotifications.mockReturnValue({ notifications: [], unreadCount: 3, markAllRead });

    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(markAllRead).toHaveBeenCalled();
  });
});
