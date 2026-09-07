import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CommunityPage from "../CommunityPage";
import { useAuth } from "../../context/useAuth";
import { useCommunityFeed } from "../../hooks/useCommunityFeed";
import { useUsers } from "../../hooks/useUsers";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../hooks/useCommunityFeed", () => ({
  useCommunityFeed: vi.fn(),
}));
vi.mock("../../hooks/useUsers", () => ({
  useUsers: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const sampleTasting = {
  _id: "tasting-1",
  rating: 4,
  moodTags: [],
  personalThoughts: "Lovely with dinner.",
  wineId: {
    name: "Rioja Reserva",
    producer: "Bodega Test",
    grape: "Tempranillo",
    country: "Spain",
    vintage: 2018,
  },
  userId: { _id: "bob-id", name: "Bob" },
};

function renderPage() {
  render(
    <MemoryRouter>
      <CommunityPage />
    </MemoryRouter>
  );
}

describe("CommunityPage", () => {
  it("lists people to follow and shows a feed of other users' tastings", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    useUsers.mockReturnValue({
      users: [{ id: "bob-id", name: "Bob", isFollowing: false }],
      loading: false,
      error: "",
      toggleFollow: vi.fn(),
    });
    useCommunityFeed.mockReturnValue({
      tastings: [sampleTasting],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Rioja Reserva")).toBeInTheDocument();
    expect(screen.getByText(/tasted by bob/i)).toBeInTheDocument();
  });

  it("calls toggleFollow when a follow button is clicked", () => {
    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    const toggleFollow = vi.fn();
    useUsers.mockReturnValue({
      users: [{ id: "bob-id", name: "Bob", isFollowing: false }],
      loading: false,
      error: "",
      toggleFollow,
    });
    useCommunityFeed.mockReturnValue({
      tastings: [],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^follow$/i }));
    expect(toggleFollow).toHaveBeenCalledWith("bob-id", false);
  });

  it("sends a logged-out visitor to log in instead of following", () => {
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    const toggleFollow = vi.fn();
    useUsers.mockReturnValue({
      users: [{ id: "bob-id", name: "Bob", isFollowing: false }],
      loading: false,
      error: "",
      toggleFollow,
    });
    useCommunityFeed.mockReturnValue({
      tastings: [],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^follow$/i }));
    expect(toggleFollow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login", expect.anything());
  });

  it("sends a logged-out visitor to log in instead of favoriting", () => {
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    const toggleFavorite = vi.fn();
    useUsers.mockReturnValue({
      users: [],
      loading: false,
      error: "",
      toggleFollow: vi.fn(),
    });
    useCommunityFeed.mockReturnValue({
      tastings: [sampleTasting],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      toggleFavorite,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /add to favorites/i }));
    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login", expect.anything());
  });
});
