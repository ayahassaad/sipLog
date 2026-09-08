process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../server");
const { connectTestDB, clearTestDB, closeTestDB } = require("./testUtils");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

let userCounter = 0;
async function registerAgent(overrides = {}) {
  userCounter += 1;
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({
    name: `Taster ${userCounter}`,
    username: `taster${userCounter}`,
    email: `taster${userCounter}@example.com`,
    password: "supersecret123",
    ...overrides,
  });
  return { agent, user: res.body.user };
}

describe("Chat access control", () => {
  it("requires a session for every chat route", async () => {
    const { user } = await registerAgent();

    const listRes = await request(app).get("/api/chat/conversations");
    const createRes = await request(app)
      .post("/api/chat/conversations")
      .send({ userId: user.id });

    expect(listRes.status).toBe(401);
    expect(createRes.status).toBe(401);
  });
});

describe("POST /api/chat/conversations", () => {
  it("creates a conversation between two users", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bob } = await registerAgent();

    const res = await alice.post("/api/chat/conversations").send({ userId: bob.id });

    expect(res.status).toBe(200);
    expect(res.body.otherUser.username).toBe(bob.username);
    expect(res.body.id).toBeTruthy();
  });

  it("returns the same conversation on a second call instead of creating a duplicate", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bob } = await registerAgent();

    const first = await alice.post("/api/chat/conversations").send({ userId: bob.id });
    const second = await alice.post("/api/chat/conversations").send({ userId: bob.id });

    expect(second.body.id).toBe(first.body.id);
  });

  it("also reuses the same conversation when the other person starts it", async () => {
    const { agent: alice, user: aliceUser } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    const fromAlice = await alice.post("/api/chat/conversations").send({ userId: bobUser.id });
    const fromBob = await bob.post("/api/chat/conversations").send({ userId: aliceUser.id });

    expect(fromBob.body.id).toBe(fromAlice.body.id);
  });

  it("rejects messaging yourself", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.post("/api/chat/conversations").send({ userId: user.id });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid or nonexistent user id", async () => {
    const { agent } = await registerAgent();

    const invalidRes = await agent.post("/api/chat/conversations").send({ userId: "not-an-id" });
    const missingRes = await agent
      .post("/api/chat/conversations")
      .send({ userId: "507f1f77bcf86cd799439011" });

    expect(invalidRes.status).toBe(400);
    expect(missingRes.status).toBe(404);
  });
});

describe("Sending and reading messages", () => {
  async function startConversation() {
    const { agent: alice, user: aliceUser } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();
    const res = await alice.post("/api/chat/conversations").send({ userId: bobUser.id });
    return { alice, aliceUser, bob, bobUser, conversationId: res.body.id };
  }

  it("sends a message and lists it back in order", async () => {
    const { alice, conversationId } = await startConversation();

    await alice.post(`/api/chat/conversations/${conversationId}/messages`).send({ text: "hey!" });
    await alice
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .send({ text: "how's it going" });

    const res = await alice.get(`/api/chat/conversations/${conversationId}/messages`);

    expect(res.status).toBe(200);
    expect(res.body.messages.map((message) => message.text)).toEqual(["hey!", "how's it going"]);
  });

  it("rejects an empty or too-long message", async () => {
    const { alice, conversationId } = await startConversation();

    const emptyRes = await alice
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .send({ text: "   " });
    const longRes = await alice
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .send({ text: "a".repeat(2001) });

    expect(emptyRes.status).toBe(400);
    expect(longRes.status).toBe(400);
  });

  it("blocks someone who isn't part of the conversation", async () => {
    const { conversationId } = await startConversation();
    const { agent: eve } = await registerAgent();

    const sendRes = await eve
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .send({ text: "sneaky" });
    const listRes = await eve.get(`/api/chat/conversations/${conversationId}/messages`);

    expect(sendRes.status).toBe(403);
    expect(listRes.status).toBe(403);
  });

  it("404s for a well-formed but nonexistent conversation id", async () => {
    const { alice } = await startConversation();

    const res = await alice.get("/api/chat/conversations/507f1f77bcf86cd799439011/messages");

    expect(res.status).toBe(404);
  });

  it("updates the inbox preview and unread count after a message is sent", async () => {
    const { alice, bob, conversationId } = await startConversation();

    await alice.post(`/api/chat/conversations/${conversationId}/messages`).send({ text: "hi bob" });

    const bobInbox = await bob.get("/api/chat/conversations");
    const aliceInbox = await alice.get("/api/chat/conversations");

    const bobEntry = bobInbox.body.find((conversation) => conversation.id === conversationId);
    const aliceEntry = aliceInbox.body.find((conversation) => conversation.id === conversationId);

    expect(bobEntry.lastMessageText).toBe("hi bob");
    expect(bobEntry.unreadCount).toBe(1);
    // Alice sent it -- it's never "unread" from her own side.
    expect(aliceEntry.unreadCount).toBe(0);
  });

  it("marking a conversation read clears the recipient's unread count", async () => {
    const { alice, bob, conversationId } = await startConversation();

    await alice.post(`/api/chat/conversations/${conversationId}/messages`).send({ text: "hi bob" });
    await bob.post(`/api/chat/conversations/${conversationId}/read`);

    const bobInbox = await bob.get("/api/chat/conversations");
    const bobEntry = bobInbox.body.find((conversation) => conversation.id === conversationId);

    expect(bobEntry.unreadCount).toBe(0);
  });
});
