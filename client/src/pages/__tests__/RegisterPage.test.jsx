import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "../RegisterPage";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

function renderRegisterPage(register) {
  useAuth.mockReturnValue({ register });
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  it("submits name, username, email and password", async () => {
    const register = vi.fn().mockResolvedValue({ name: "Ayah" });
    renderRegisterPage(register);

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ayah Assaad" } });
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "ayahassaad" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ayah@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        name: "Ayah Assaad",
        username: "ayahassaad",
        email: "ayah@example.com",
        password: "supersecret123",
      })
    );
  });

  it("shows a warning to pick a different username when it's already taken", async () => {
    const register = vi.fn().mockRejectedValue(new Error("That username is already taken"));
    renderRegisterPage(register);

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ayah Assaad" } });
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "taken" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ayah@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("That username is already taken")).toBeInTheDocument();
  });
});
