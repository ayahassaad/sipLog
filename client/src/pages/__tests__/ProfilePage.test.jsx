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
  username: "ayah",
  email: "ayah@example.com",
  avatarUrl: "",
  // Only the counts (following.length / followers.length) are read now --
  // the profile page no longer renders the individual people in these lists.
  following: [{ id: "bob-id" }],
  followers: [{ id: "carla-id" }],
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

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });

    updateProfile = vi.fn().mockResolvedValue({ ...sampleProfile, name: "Ayah A." });
    updateEmail = vi.fn().mockResolvedValue({ ...sampleProfile, email: "new@example.com" });
    updatePassword = vi.fn().mockResolvedValue({ message: "Password updated" });

    useProfile.mockReturnValue({
      profile: sampleProfile,
      loading: false,
      error: "",
      updateProfile,
      updateEmail,
      updatePassword,
    });
  });

  it("shows the profile info and the following/followers counts", () => {
    const { container } = renderPage();

    expect(screen.getByText("Ayah")).toBeInTheDocument();
    expect(screen.getByText("@ayah")).toBeInTheDocument();
    expect(screen.queryByText("ayah@example.com")).not.toBeInTheDocument();

    // Following/Followers now show only as counts in the header's stat row --
    // there's no longer a list of the actual people below.
    const statNums = container.querySelectorAll(".profile-stat-num");
    expect(statNums).toHaveLength(2);
    expect(statNums[0]).toHaveTextContent("1");
    expect(statNums[1]).toHaveTextContent("1");
    expect(screen.queryByText("@bob")).not.toBeInTheDocument();
    expect(screen.queryByText("@carla")).not.toBeInTheDocument();
  });

  it("saves a new name and username from edit mode", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ayah A." } });
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "ayah_a" } });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({ name: "Ayah A.", username: "ayah_a" })
    );
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
