import { act, render, screen, fireEvent } from "@testing-library/react";
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
  createdAt: "2026-09-07T15:42:00.000Z",
  wineId: {
    name: "Rioja Reserva",
    producer: "Bodega Test",
    grape: "Tempranillo",
    country: "Spain",
    vintage: 2018,
  },
  userId: { _id: "bob-id", name: "Bob", username: "bob" },
};

function renderPage() {
  render(
    <MemoryRouter>
      <CommunityPage />
    </MemoryRouter>
  );
}

describe("CommunityPage", () => {
  it("shows the feed as a timeline, with each post's author and no dropdown of people to follow", () => {
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
      search: "",
      runSearch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Rioja Reserva")).toBeInTheDocument();
    expect(screen.getByText("Posted by @bob")).toBeInTheDocument();
    expect(screen.queryByText(/tasted by/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/people to follow/i)).not.toBeInTheDocument();
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
      tastings: [sampleTasting],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      search: "",
      runSearch: vi.fn(),
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
      tastings: [sampleTasting],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      search: "",
      runSearch: vi.fn(),
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
      search: "",
      runSearch: vi.fn(),
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /add to favorites/i }));
    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login", expect.anything());
  });

  it("debounces the wine search box before querying the feed", () => {
    vi.useFakeTimers();

    useAuth.mockReturnValue({ user: { name: "Ayah" }, logout: vi.fn() });
    useUsers.mockReturnValue({
      users: [{ id: "bob-id", name: "Bob", isFollowing: false }],
      loading: false,
      error: "",
      toggleFollow: vi.fn(),
    });
    const runSearch = vi.fn();
    useCommunityFeed.mockReturnValue({
      tastings: [sampleTasting],
      loading: false,
      error: "",
      hasMore: false,
      loadMore: vi.fn(),
      search: "",
      runSearch,
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/search wines/i), {
      target: { value: "rioja" },
    });

    // Nothing fires until the debounce window passes.
    expect(runSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(runSearch).toHaveBeenCalledWith("rioja");

    vi.useRealTimers();
  });
});
