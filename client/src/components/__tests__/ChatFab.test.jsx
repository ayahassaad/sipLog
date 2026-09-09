import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatFab from "../ChatFab";
import { useAuth } from "../../context/useAuth";
import { useConversations } from "../../hooks/useConversations";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useConversations", () => ({
  useConversations: vi.fn(),
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<ChatFab />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ChatFab", () => {
  beforeEach(() => {
    useConversations.mockReturnValue({ totalUnread: 0 });
  });

  it("shows a button to open the chat popup when logged in", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });

    renderAt("/");

    expect(screen.getByRole("button", { name: /messages/i })).toHaveAttribute(
      "aria-haspopup",
      "true"
    );
  });

  it("renders nothing when logged out", () => {
    useAuth.mockReturnValue({ user: null });

    renderAt("/");

    expect(screen.queryByRole("button", { name: /messages/i })).not.toBeInTheDocument();
  });

  it("renders nothing while already on the chat page", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });

    renderAt("/chat");

    expect(screen.queryByRole("button", { name: /messages/i })).not.toBeInTheDocument();
  });

  it("shows no badge when there are no unread messages", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });
    useConversations.mockReturnValue({ totalUnread: 0 });

    const { container } = renderAt("/");

    expect(container.querySelector(".chat-fab-badge")).not.toBeInTheDocument();
  });

  it("shows the unread count on the badge", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });
    useConversations.mockReturnValue({ totalUnread: 3 });

    renderAt("/");

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 10+ once unread messages pass ten", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });
    useConversations.mockReturnValue({ totalUnread: 14 });

    renderAt("/");

    expect(screen.getByText("10+")).toBeInTheDocument();
  });
});
