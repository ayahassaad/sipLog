import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import SettingsPage from "../SettingsPage";
import { useAuth } from "../../context/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useConversations } from "../../hooks/useConversations";
import { useNotifications } from "../../hooks/useNotifications";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));
// SiteHeader always renders ChatFab, which calls useConversations
// (for its unread badge) unconditionally per the rules of hooks --
// mocked here so these tests don't need a real SocketProvider/backend
// just to render the page.
vi.mock("../../hooks/useConversations", () => ({
  useConversations: vi.fn(),
}));

// SiteHeader also always renders NotificationBell when logged in, which
// calls useNotifications (and, through it, the same real useSocket() that
// throws outside a SocketProvider) -- mocked for the same reason as
// useConversations above.
vi.mock("../../hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe("SettingsPage", () => {
  let updateEmail;
  let updatePassword;

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    useConversations.mockReturnValue({ totalUnread: 0 });
    useNotifications.mockReturnValue({ notifications: [], unreadCount: 0, markAllRead: vi.fn() });

    updateEmail = vi.fn().mockResolvedValue({ email: "new@example.com" });
    updatePassword = vi.fn().mockResolvedValue({ message: "Password updated" });

    useProfile.mockReturnValue({
      loading: false,
      error: "",
      updateEmail,
      updatePassword,
    });
  });

  it("submits an email change with the current password", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/new email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getAllByLabelText(/current password/i)[0], {
      target: { value: "supersecret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() =>
      expect(updateEmail).toHaveBeenCalledWith({
        newEmail: "new@example.com",
        currentPassword: "supersecret123",
      })
    );
  });

  it("blocks a password change when the confirmation doesn't match", async () => {
    renderPage();

    fireEvent.change(screen.getAllByLabelText(/current password/i)[1], {
      target: { value: "supersecret123" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "brand-new-password" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "does-not-match" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("submits a password change when the confirmation matches", async () => {
    renderPage();

    fireEvent.change(screen.getAllByLabelText(/current password/i)[1], {
      target: { value: "supersecret123" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "brand-new-password" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "brand-new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(updatePassword).toHaveBeenCalledWith({
        currentPassword: "supersecret123",
        newPassword: "brand-new-password",
      })
    );
  });
});
