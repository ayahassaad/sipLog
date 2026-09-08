import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProfilePage from "../ProfilePage";
import { useAuth } from "../../context/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { compressImage } from "../../utils/compressImage";
import { uploadImage } from "../../services/uploadService";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));
vi.mock("../../utils/compressImage", () => ({
  compressImage: vi.fn(),
}));
vi.mock("../../services/uploadService", () => ({
  uploadImage: vi.fn(),
}));

const sampleProfile = {
  id: "me-id",
  name: "Ayah",
  email: "ayah@example.com",
  avatarUrl: "",
  following: [{ id: "bob-id", name: "Bob", avatarUrl: "", isFollowing: true }],
  followers: [{ id: "carla-id", name: "Carla", avatarUrl: "", isFollowing: false }],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe("ProfilePage", () => {
  let updateProfile;
  let updateEmail;
  let updatePassword;
  let toggleFollow;

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    updateProfile = vi.fn().mockResolvedValue({ ...sampleProfile, name: "Ayah A." });
    updateEmail = vi.fn().mockResolvedValue({ ...sampleProfile, email: "new@example.com" });
    updatePassword = vi.fn().mockResolvedValue({ message: "Password updated" });
    toggleFollow = vi.fn();

    useProfile.mockReturnValue({
      profile: sampleProfile,
      loading: false,
      error: "",
      updateProfile,
      updateEmail,
      updatePassword,
      toggleFollow,
    });
  });

  it("shows the profile info and both connection lists", () => {
    renderPage();

    expect(screen.getByText("Ayah")).toBeInTheDocument();
    expect(screen.getByText("ayah@example.com")).toBeInTheDocument();
    expect(screen.getByText("Following (1)")).toBeInTheDocument();
    expect(screen.getByText("Followers (1)")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carla")).toBeInTheDocument();
  });

  it("saves a new name from edit mode", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ayah A." } });
    fireEvent.click(screen.getByRole("button", { name: /save name/i }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ name: "Ayah A." }));
  });

  it("submits an email change with the current password", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
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

  it("calls toggleFollow when following someone back from the Followers list", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^follow$/i }));
    expect(toggleFollow).toHaveBeenCalledWith("carla-id", false);
  });

  it("uploads and saves a new avatar photo", async () => {
    compressImage.mockResolvedValue("data:image/jpeg;base64,compressed");
    uploadImage.mockResolvedValue("https://example.com/avatar.jpg");

    const { container } = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

    const file = new File(["photo"], "avatar.png", { type: "image/png" });
    const fileInput = container.querySelector("#avatar-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        avatarUrl: "https://example.com/avatar.jpg",
      })
    );
    expect(compressImage).toHaveBeenCalledWith(file);
    expect(uploadImage).toHaveBeenCalledWith("data:image/jpeg;base64,compressed", {
      type: "avatar",
    });
  });
});
