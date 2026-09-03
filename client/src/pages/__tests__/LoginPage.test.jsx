import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "../LoginPage";
import { useAuth } from "../../context/useAuth";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

function renderLoginPage(login) {
  useAuth.mockReturnValue({ login });
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("submits the entered credentials", async () => {
    const login = vi.fn().mockResolvedValue({ name: "Ayah" });
    renderLoginPage(login);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ayah@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "ayah@example.com",
        password: "supersecret123",
      })
    );
  });

  it("shows an error message when login fails", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Invalid email or password"));
    renderLoginPage(login);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ayah@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});
