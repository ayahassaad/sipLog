import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProfilePage from "../ProfilePage";
import { useAuth } from "../../context/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { compressImage } from "../../utils/compressImage";
import { uploadImage } from "../../services/uploadService";
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

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    useConversations.mockReturnValue({ totalUnread: 0 });
    useNotifications.mockReturnValue({ notifications: [], unreadCount: 0, markAllRead: vi.fn() });

    updateProfile = vi.fn().mockResolvedValue({ ...sampleProfile, name: "Ayah A." });

    useProfile.mockReturnValue({
      profile: sampleProfile,
      loading: false,
      error: "",
      updateProfile,
    });
  });

  it("shows the profile info and the following/followers counts", () => {
    const { container } = renderPage();

    // Ayah's own name/header profile chip also renders "Ayah" in
    // SiteHeader now, so scope this to the profile page's own heading.
    expect(screen.getByRole("heading", { name: "Ayah" })).toBeInTheDocument();
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

  it("saves a new name and username from edit mode, then returns to the view", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ayah A." } });
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "ayah_a" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({ name: "Ayah A.", username: "ayah_a" })
    );

    // Saving drops you back into the read-only view rather than leaving the
    // form (and its "Done editing" button) open.
    expect(await screen.findByRole("button", { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /done editing/i })).not.toBeInTheDocument();
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
