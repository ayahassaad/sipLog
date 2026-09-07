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
async function registerAgent() {
  userCounter += 1;
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({
    name: `Taster ${userCounter}`,
    email: `taster${userCounter}@example.com`,
    password: "supersecret123",
  });
  return { agent, user: res.body.user };
}

async function createWine(agent, overrides = {}) {
  const res = await agent.post("/api/wines").send({
    name: "Test Wine",
    producer: "Test Producer",
    country: "Testland",
    grape: "Testgrape",
    vintage: 2020,
    ...overrides,
  });
  return res.body;
}

const baseTasting = {
  appearance: "Ruby",
  sweetness: 1,
  acidity: 3,
  body: 3,
  tannin: 2,
  rating: 4,
};

describe("Auth is required", () => {
  it("blocks the user directory and follow routes without a session", async () => {
    const list = await request(app).get("/api/users");
    const follow = await request(app).post("/api/users/000000000000000000000000/follow");
    const feed = await request(app).get("/api/tastings/feed");

    expect(list.status).toBe(401);
    expect(follow.status).toBe(401);
    expect(feed.status).toBe(401);
  });
});

describe("User directory", () => {
  it("lists other users but never yourself", async () => {
    const { agent: alice } = await registerAgent();
    await registerAgent();

    const res = await alice.get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Taster 2");
    expect(res.body[0]).not.toHaveProperty("email");
  });
});

describe("Following", () => {
  it("follows a user and reflects isFollowing in the directory", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bob } = await registerAgent();

    const before = await alice.get("/api/users");
    expect(before.body[0].isFollowing).toBe(false);

    const followRes = await alice.post(`/api/users/${bob.id}/follow`);
    expect(followRes.status).toBe(200);

    const after = await alice.get("/api/users");
    expect(after.body[0].isFollowing).toBe(true);
  });

  it("unfollows a user", async () => {
    const { agent: alice } = await registerAgent();
    const { user: bob } = await registerAgent();

    await alice.post(`/api/users/${bob.id}/follow`);
    const unfollowRes = await alice.post(`/api/users/${bob.id}/unfollow`);
    expect(unfollowRes.status).toBe(200);

    const after = await alice.get("/api/users");
    expect(after.body[0].isFollowing).toBe(false);
  });

  it("rejects following yourself", async () => {
    const { agent: alice, user: aliceUser } = await registerAgent();

    const res = await alice.post(`/api/users/${aliceUser.id}/follow`);
    expect(res.status).toBe(400);
  });

  it("404s when following a user that doesn't exist", async () => {
    const { agent: alice } = await registerAgent();

    const res = await alice.post("/api/users/000000000000000000000000/follow");
    expect(res.status).toBe(404);
  });
});

describe("Community feed", () => {
  it("shows other users' tastings but never your own", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    const aliceWine = await createWine(alice, { name: "Alice's Wine" });
    const bobWine = await createWine(bob, { name: "Bob's Wine" });

    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: bobWine._id });

    const feed = await alice.get("/api/tastings/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(1);
    expect(feed.body.tastings[0].userId.name).toBe(bobUser.name);
    expect(feed.body).toHaveProperty("page");
    expect(feed.body).toHaveProperty("totalPages");
  });

  it("returns an empty feed when no one else has posted", async () => {
    const { agent: alice } = await registerAgent();
    const aliceWine = await createWine(alice);
    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });

    const feed = await alice.get("/api/tastings/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(0);
  });
});
