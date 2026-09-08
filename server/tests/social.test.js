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
    username: `taster${userCounter}`,
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

describe("Public browsing vs. auth-required actions", () => {
  it("lets a logged-out visitor browse the user directory and community feed", async () => {
    const list = await request(app).get("/api/users");
    const feed = await request(app).get("/api/tastings/feed");

    expect(list.status).toBe(200);
    expect(feed.status).toBe(200);
  });

  it("still blocks follow/unfollow without a session", async () => {
    const follow = await request(app).post("/api/users/000000000000000000000000/follow");
    const unfollow = await request(app).post("/api/users/000000000000000000000000/unfollow");

    expect(follow.status).toBe(401);
    expect(unfollow.status).toBe(401);
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

  it("shows everyone (with isFollowing false) to a logged-out visitor", async () => {
    await registerAgent();
    await registerAgent();

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((user) => user.isFollowing === false)).toBe(true);
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

describe("Favorites", () => {
  it("favorites a tasting and reflects isFavorited in My Journal", async () => {
    const { agent: alice } = await registerAgent();
    const aliceWine = await createWine(alice);
    const created = await alice
      .post("/api/tastings")
      .send({ ...baseTasting, wineId: aliceWine._id });

    const before = await alice.get("/api/tastings");
    expect(before.body.tastings[0].isFavorited).toBe(false);

    const favoriteRes = await alice.post(`/api/tastings/${created.body._id}/favorite`);
    expect(favoriteRes.status).toBe(200);

    const after = await alice.get("/api/tastings");
    expect(after.body.tastings[0].isFavorited).toBe(true);
  });

  it("unfavorites a tasting", async () => {
    const { agent: alice } = await registerAgent();
    const aliceWine = await createWine(alice);
    const created = await alice
      .post("/api/tastings")
      .send({ ...baseTasting, wineId: aliceWine._id });

    await alice.post(`/api/tastings/${created.body._id}/favorite`);
    const unfavoriteRes = await alice.post(`/api/tastings/${created.body._id}/unfavorite`);
    expect(unfavoriteRes.status).toBe(200);

    const after = await alice.get("/api/tastings");
    expect(after.body.tastings[0].isFavorited).toBe(false);
  });

  it("can favorite someone else's tasting, and it shows up in /tastings/favorites", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    const bobWine = await createWine(bob, { name: "Bob's Wine" });
    const bobTasting = await bob
      .post("/api/tastings")
      .send({ ...baseTasting, wineId: bobWine._id });

    await alice.post(`/api/tastings/${bobTasting.body._id}/favorite`);

    const favorites = await alice.get("/api/tastings/favorites");
    expect(favorites.status).toBe(200);
    expect(favorites.body.tastings).toHaveLength(1);
    expect(favorites.body.tastings[0].userId.name).toBe(bobUser.name);
    expect(favorites.body.tastings[0].isFavorited).toBe(true);

    // Favoriting someone else's tasting never shows up in your own private
    // journal listing -- that's still scoped to tastings you posted.
    const aliceJournal = await alice.get("/api/tastings");
    expect(aliceJournal.body.tastings).toHaveLength(0);
  });

  it("does not favorite a tasting that doesn't exist", async () => {
    const { agent: alice } = await registerAgent();

    const res = await alice.post("/api/tastings/000000000000000000000000/favorite");
    expect(res.status).toBe(404);
  });

  it("requires auth for favorite routes", async () => {
    const favorite = await request(app).post("/api/tastings/000000000000000000000000/favorite");
    const favorites = await request(app).get("/api/tastings/favorites");

    expect(favorite.status).toBe(401);
    expect(favorites.status).toBe(401);
  });
});

describe("Community feed", () => {
  it("shows every user's tastings, including your own", async () => {
    const { agent: alice, user: aliceUser } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    const aliceWine = await createWine(alice, { name: "Alice's Wine" });
    const bobWine = await createWine(bob, { name: "Bob's Wine" });

    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: bobWine._id });

    const feed = await alice.get("/api/tastings/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(2);
    const authorNames = feed.body.tastings.map((tasting) => tasting.userId.name);
    expect(authorNames).toEqual(expect.arrayContaining([aliceUser.name, bobUser.name]));
    expect(feed.body).toHaveProperty("page");
    expect(feed.body).toHaveProperty("totalPages");
  });

  it("shows every tasting (with isFavorited false) to a logged-out visitor", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob } = await registerAgent();

    const aliceWine = await createWine(alice, { name: "Alice's Wine" });
    const bobWine = await createWine(bob, { name: "Bob's Wine" });

    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: bobWine._id });

    const feed = await request(app).get("/api/tastings/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(2);
    expect(feed.body.tastings.every((tasting) => tasting.isFavorited === false)).toBe(true);
  });

  it("shows your own tasting even when no one else has posted", async () => {
    const { agent: alice } = await registerAgent();
    const aliceWine = await createWine(alice);
    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });

    const feed = await alice.get("/api/tastings/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(1);
  });

  it("filters the feed by wine name, producer, or grape when searching", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob } = await registerAgent();

    const riojaWine = await createWine(bob, {
      name: "Rioja Reserva",
      producer: "Marques de Riscal",
      grape: "Tempranillo",
    });
    const chiantiWine = await createWine(bob, {
      name: "Chianti Classico",
      producer: "Ruffino",
      grape: "Sangiovese",
    });

    await bob.post("/api/tastings").send({ ...baseTasting, wineId: riojaWine._id });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: chiantiWine._id });

    const byName = await alice.get("/api/tastings/feed").query({ search: "rioja" });
    expect(byName.status).toBe(200);
    expect(byName.body.tastings).toHaveLength(1);
    expect(byName.body.tastings[0].wineId.name).toBe("Rioja Reserva");

    // Case-insensitive, and matches on producer or grape too.
    const byProducer = await alice.get("/api/tastings/feed").query({ search: "ruffino" });
    expect(byProducer.body.tastings).toHaveLength(1);
    expect(byProducer.body.tastings[0].wineId.name).toBe("Chianti Classico");

    const byGrape = await alice.get("/api/tastings/feed").query({ search: "SANGIOVESE" });
    expect(byGrape.body.tastings).toHaveLength(1);
    expect(byGrape.body.tastings[0].wineId.name).toBe("Chianti Classico");

    const noMatch = await alice.get("/api/tastings/feed").query({ search: "does-not-exist" });
    expect(noMatch.body.tastings).toHaveLength(0);
  });

  it("treats search input safely even when it contains regex metacharacters", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob } = await registerAgent();

    const wine = await createWine(bob, { name: "Chateau (Reserve)" });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: wine._id });

    const feed = await alice.get("/api/tastings/feed").query({ search: "Chateau (Reserve)" });

    expect(feed.status).toBe(200);
    expect(feed.body.tastings).toHaveLength(1);
  });

  it("also matches search against the tasting author's username or name", async () => {
    const { agent: alice } = await registerAgent();
    const { agent: bob, user: bobUser } = await registerAgent();

    const aliceWine = await createWine(alice, { name: "Alice's Wine" });
    const bobWine = await createWine(bob, { name: "Bob's Wine" });

    await alice.post("/api/tastings").send({ ...baseTasting, wineId: aliceWine._id });
    await bob.post("/api/tastings").send({ ...baseTasting, wineId: bobWine._id });

    const byUsername = await alice.get("/api/tastings/feed").query({ search: bobUser.username });
    expect(byUsername.status).toBe(200);
    expect(byUsername.body.tastings).toHaveLength(1);
    expect(byUsername.body.tastings[0].userId.username).toBe(bobUser.username);

    const byName = await alice.get("/api/tastings/feed").query({ search: bobUser.name });
    expect(byName.body.tastings).toHaveLength(1);
    expect(byName.body.tastings[0].userId.username).toBe(bobUser.username);
  });
});
