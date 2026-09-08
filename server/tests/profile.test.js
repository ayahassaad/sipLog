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

describe("GET /api/users/me", () => {
  it("requires a session", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns your own profile with empty following/followers lists", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.get("/api/users/me");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: "",
      following: [],
      followers: [],
    });
  });

  it("lists who you follow and who follows you, with isFollowing on followers", async () => {
    const { agent: alice, user: aliceUser } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    await alice.post(`/api/users/${bobUser.id}/follow`);

    const aliceProfile = await alice.get("/api/users/me");
    expect(aliceProfile.body.following).toHaveLength(1);
    expect(aliceProfile.body.following[0].id).toBe(bobUser.id);
    expect(aliceProfile.body.followers).toHaveLength(0);

    const bobProfile = await bob.get("/api/users/me");
    expect(bobProfile.body.followers).toHaveLength(1);
    expect(bobProfile.body.followers[0].id).toBe(aliceUser.id);
    // Bob doesn't follow Alice back yet.
    expect(bobProfile.body.followers[0].isFollowing).toBe(false);

    await bob.post(`/api/users/${aliceUser.id}/follow`);
    const bobProfileAfter = await bob.get("/api/users/me");
    expect(bobProfileAfter.body.followers[0].isFollowing).toBe(true);
  });
});

describe("PATCH /api/users/me", () => {
  it("updates your name", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me").send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });

  it("updates your avatar URL", async () => {
    const { agent } = await registerAgent();

    const res = await agent
      .patch("/api/users/me")
      .send({ avatarUrl: "https://example.com/me.jpg" });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe("https://example.com/me.jpg");
  });

  it("rejects an empty name", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me").send({ name: "   " });

    expect(res.status).toBe(400);
  });

  it("updates your username", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me").send({ username: "New_Handle" });

    expect(res.status).toBe(200);
    // Stored (and returned) lowercased, same as email.
    expect(res.body.username).toBe("new_handle");
  });

  it("rejects a username already taken by someone else", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bobUser } = await registerAgent();

    const res = await alice.patch("/api/users/me").send({ username: bobUser.username });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid username", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me").send({ username: "no spaces!" });

    expect(res.status).toBe(400);
  });

  it("requires a session", async () => {
    const res = await request(app).patch("/api/users/me").send({ name: "Nope" });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/users/me/email", () => {
  it("updates your email when the current password is correct", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me/email").send({
      newEmail: "new-address@example.com",
      currentPassword: "supersecret123",
    });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("new-address@example.com");
  });

  it("rejects the wrong current password", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me/email").send({
      newEmail: "new-address@example.com",
      currentPassword: "totally-wrong",
    });

    expect(res.status).toBe(401);
  });

  it("rejects an email already used by another account", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bobUser } = await registerAgent();

    const res = await alice.patch("/api/users/me/email").send({
      newEmail: bobUser.email,
      currentPassword: "supersecret123",
    });

    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/users/me/password", () => {
  it("updates your password and lets you log in with the new one", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.patch("/api/users/me/password").send({
      currentPassword: "supersecret123",
      newPassword: "brand-new-password",
    });
    expect(res.status).toBe(200);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "brand-new-password",
    });
    expect(loginRes.status).toBe(200);
  });

  it("rejects the wrong current password", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me/password").send({
      currentPassword: "totally-wrong",
      newPassword: "brand-new-password",
    });

    expect(res.status).toBe(401);
  });

  it("rejects a new password that's too short", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/users/me/password").send({
      currentPassword: "supersecret123",
      newPassword: "short",
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/users/:username", () => {
  it("returns 404 for a username that doesn't exist", async () => {
    const res = await request(app).get("/api/users/nobody-here");
    expect(res.status).toBe(404);
  });

  it("returns public profile fields without leaking email, to a logged-out visitor", async () => {
    const { user } = await registerAgent();

    const res = await request(app).get(`/api/users/${user.username}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      username: user.username,
      name: user.name,
      followingCount: 0,
      followersCount: 0,
      isFollowing: false,
      isOwnProfile: false,
    });
    expect(res.body.email).toBeUndefined();
  });

  it("reflects follow state and counts relative to the viewer", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bobUser } = await registerAgent();

    const before = await alice.get(`/api/users/${bobUser.username}`);
    expect(before.body.isFollowing).toBe(false);
    expect(before.body.followersCount).toBe(0);

    await alice.post(`/api/users/${bobUser.id}/follow`);

    const after = await alice.get(`/api/users/${bobUser.username}`);
    expect(after.body.isFollowing).toBe(true);
    expect(after.body.followersCount).toBe(1);
  });

  it("marks isOwnProfile when you view yourself", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.get(`/api/users/${user.username}`);

    expect(res.body.isOwnProfile).toBe(true);
  });
});
