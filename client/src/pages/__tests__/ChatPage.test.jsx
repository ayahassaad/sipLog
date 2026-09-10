import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatPage from "../ChatPage";
import { useAuth } from "../../context/useAuth";
import { useConversations } from "../../hooks/useConversations";
import { useNotifications } from "../../hooks/useNotifications";
import { useChatThread } from "../../hooks/useChatThread";
import { useUsers } from "../../hooks/useUsers";
import { fetchUserProfile } from "../../services/userService";
import { getOrCreateConversation } from "../../services/chatService";

// ChatPage renders SiteHeader, which calls the real useAuth() -- mock it
// the same way AdminPage/CommunityPage's tests do so that doesn't need a
// real AuthProvider around every render below.
vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));
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
vi.mock("../../hooks/useChatThread", () => ({
  useChatThread: vi.fn(),
}));
vi.mock("../../hooks/useUsers", () => ({
  useUsers: vi.fn(),
}));
vi.mock("../../services/userService", () => ({
  fetchUserProfile: vi.fn(),
}));
vi.mock("../../services/chatService", () => ({
  getOrCreateConversation: vi.fn(),
}));

let mockParams = {};
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams };
});

const bobConversation = {
  id: "conversation-1",
  otherUser: { id: "bob-id", name: "Bob", username: "bob", avatarUrl: "" },
  lastMessageAt: "2026-01-05T00:00:00.000Z",
  lastMessageText: "See you at the tasting!",
  unreadCount: 2,
};

const baseConversationsState = {
  conversations: [],
  loading: false,
  error: "",
  totalUnread: 0,
  refresh: vi.fn(),
};

const baseThreadState = {
  messages: [],
  loading: false,
  error: "",
  sending: false,
  send: vi.fn(),
};

const baseUsersState = {
  users: [],
  loading: false,
  error: "",
  refresh: vi.fn(),
  toggleFollow: vi.fn(),
};

function renderChatPage() {
  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockParams = {};
  mockNavigate.mockClear();
  useAuth.mockReturnValue({ user: { id: "me-id", name: "Ayah" }, logout: vi.fn() });
  useConversations.mockReturnValue(baseConversationsState);
  useNotifications.mockReturnValue({ notifications: [], unreadCount: 0, markAllRead: vi.fn() });
  useChatThread.mockReturnValue(baseThreadState);
  useUsers.mockReturnValue(baseUsersState);
});

describe("ChatPage inbox", () => {
  it("lists conversations with a preview and unread badge", () => {
    useConversations.mockReturnValue({ ...baseConversationsState, conversations: [bobConversation] });

    renderChatPage();

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("See you at the tasting!")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an empty state with no conversations", () => {
    renderChatPage();

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("prompts to select a conversation before one is picked", () => {
    useConversations.mockReturnValue({ ...baseConversationsState, conversations: [bobConversation] });

    renderChatPage();

    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });
});

describe("ChatPage thread", () => {
  it("opens a conversation and shows its messages", () => {
    useConversations.mockReturnValue({ ...baseConversationsState, conversations: [bobConversation] });
    useChatThread.mockReturnValue({
      ...baseThreadState,
      messages: [
        { id: "m1", conversationId: "conversation-1", senderId: "bob-id", text: "Hey!" },
        { id: "m2", conversationId: "conversation-1", senderId: "me-id", text: "Hi Bob" },
      ],
    });

    renderChatPage();
    fireEvent.click(screen.getByText("Bob"));

    expect(screen.getByText("Hey!")).toBeInTheDocument();
    expect(screen.getByText("Hi Bob")).toBeInTheDocument();
  });

  it("sends a message from the composer and clears the input", async () => {
    const send = vi.fn().mockResolvedValue({ id: "m3" });
    useConversations.mockReturnValue({ ...baseConversationsState, conversations: [bobConversation] });
    useChatThread.mockReturnValue({ ...baseThreadState, send });

    renderChatPage();
    fireEvent.click(screen.getByText("Bob"));

    const input = screen.getByPlaceholderText(/write a message/i);
    fireEvent.change(input, { target: { value: "Sounds great!" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(send).toHaveBeenCalledWith("Sounds great!"));
    expect(input.value).toBe("");
  });

  it("does not send a blank message", () => {
    const send = vi.fn();
    useConversations.mockReturnValue({ ...baseConversationsState, conversations: [bobConversation] });
    useChatThread.mockReturnValue({ ...baseThreadState, send });

    renderChatPage();
    fireEvent.click(screen.getByText("Bob"));

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });
});

describe("ChatPage deep link from a profile", () => {
  it("resolves /chat/:username into a conversation and swaps the URL", async () => {
    mockParams = { username: "bob" };
    fetchUserProfile.mockResolvedValue({ id: "bob-id", username: "bob" });
    getOrCreateConversation.mockResolvedValue(bobConversation);

    renderChatPage();

    await waitFor(() => expect(getOrCreateConversation).toHaveBeenCalledWith("bob-id"));
    expect(fetchUserProfile).toHaveBeenCalledWith("bob");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/chat", { replace: true }));
  });

  it("shows an error if the deep-linked user can't be found", async () => {
    mockParams = { username: "ghost" };
    fetchUserProfile.mockRejectedValue(new Error("User not found"));

    renderChatPage();

    await waitFor(() => expect(screen.getByText("User not found")).toBeInTheDocument());
  });
});

describe("ChatPage search for someone to message", () => {
  const dana = { id: "dana-id", name: "Dana", username: "dana", avatarUrl: "" };

  it("filters the user directory as you type and starts a conversation on click", async () => {
    useUsers.mockReturnValue({ ...baseUsersState, users: [dana] });
    getOrCreateConversation.mockResolvedValue({
      id: "conversation-2",
      otherUser: dana,
      lastMessageAt: null,
      lastMessageText: "",
    });

    renderChatPage();
    fireEvent.change(screen.getByPlaceholderText(/find someone to message/i), {
      target: { value: "dan" },
    });

    expect(screen.getByText("Dana")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dana"));

    await waitFor(() => expect(getOrCreateConversation).toHaveBeenCalledWith("dana-id"));
  });

  it("excludes yourself and shows nothing for an unmatched search", () => {
    useUsers.mockReturnValue({ ...baseUsersState, users: [{ id: "me-id", name: "Ayah", username: "ayah" }] });

    renderChatPage();
    fireEvent.change(screen.getByPlaceholderText(/find someone to message/i), {
      target: { value: "ayah" },
    });

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });
});
