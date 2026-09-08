import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ChatFab from "../ChatFab";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
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
  it("shows a link to /chat when logged in", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });

    renderAt("/");

    expect(screen.getByRole("link", { name: /messages/i })).toHaveAttribute("href", "/chat");
  });

  it("renders nothing when logged out", () => {
    useAuth.mockReturnValue({ user: null });

    renderAt("/");

    expect(screen.queryByRole("link", { name: /messages/i })).not.toBeInTheDocument();
  });

  it("renders nothing while already on the chat page", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" } });

    renderAt("/chat");

    expect(screen.queryByRole("link", { name: /messages/i })).not.toBeInTheDocument();
  });
});
