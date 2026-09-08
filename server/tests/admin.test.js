process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
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

// There's no API for this on purpose (see scripts/setSuperAdmin.js) -- tests
// flip the flags directly on the document, the same way that script does.
async function grantAdmin(userId, { superAdmin = false } = {}) {
  await User.findByIdAndUpdate(userId, {
    isAdmin: true,
    isSuperAdmin: superAdmin,
  });
}

describe("Admin access control", () => {
  it("requires a session for the admin routes", async () => {
    const usersRes = await request(app).get("/api/admin/users");
    const statsRes = await request(app).get("/api/admin/stats");

    expect(usersRes.status).toBe(401);
    expect(statsRes.status).toBe(401);
  });

  it("blocks a plain logged-in user from the admin routes", async () => {
    const { agent } = await registerAgent();

    const usersRes = await agent.get("/api/admin/users");
    const statsRes = await agent.get("/api/admin/stats");

    expect(usersRes.status).toBe(403);
    expect(statsRes.status).toBe(403);
  });

  it("lets an admin (not just the super admin) browse the user directory and stats", async () => {
    const { agent, user } = await registerAgent();
    await grantAdmin(user.id);

    const usersRes = await agent.get("/api/admin/users");
    const statsRes = await agent.get("/api/admin/stats");

    expect(usersRes.status).toBe(200);
    expect(statsRes.status).toBe(200);
  });

  it("blocks a plain admin (not super admin) from granting admin access", async () => {
    const { agent: adminAgent, user: admin } = await registerAgent();
    await grantAdmin(admin.id);
    const { user: target } = await registerAgent();

    const res = await adminAgent
      .patch(`/api/admin/users/${target.id}/admin`)
      .send({ isAdmin: true });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/users", () => {
  it("returns the user directory without exposing email", async () => {
    const { agent, user } = await registerAgent();
    await grantAdmin(user.id, { superAdmin: true });
    await registerAgent();

    const res = await agent.get("/api/admin/users");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.users[0].email).toBeUndefined();
    expect(res.body.users[0]).toHaveProperty("isAdmin");
    expect(res.body.users[0]).toHaveProperty("createdAt");
  });

  it("filters by a name/username search", async () => {
    const { agent, user } = await registerAgent();
    await grantAdmin(user.id, { superAdmin: true });
    await registerAgent({ name: "Zara Vine", username: "zara" });

    const res = await agent.get("/api/admin/users").query({ search: "zara" });

    expect(res.body.total).toBe(1);
    expect(res.body.users[0].username).toBe("zara");
  });
});

describe("PATCH /api/admin/users/:id/admin", () => {
  it("lets the super admin grant admin access to another user", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });
    const { user: target } = await registerAgent();

    const res = await agent
      .patch(`/api/admin/users/${target.id}/admin`)
      .send({ isAdmin: true });

    expect(res.status).toBe(200);
    expect(res.body.user.isAdmin).toBe(true);
  });

  it("lets the super admin revoke admin access", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });
    const { user: target } = await registerAgent();
    await grantAdmin(target.id);

    const res = await agent
      .patch(`/api/admin/users/${target.id}/admin`)
      .send({ isAdmin: false });

    expect(res.status).toBe(200);
    expect(res.body.user.isAdmin).toBe(false);
  });

  it("won't let the super admin change their own admin access", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });

    const res = await agent
      .patch(`/api/admin/users/${superAdmin.id}/admin`)
      .send({ isAdmin: false });

    expect(res.status).toBe(400);
  });

  it("won't let the super admin change another super admin's access", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });
    const { user: otherSuperAdmin } = await registerAgent();
    await grantAdmin(otherSuperAdmin.id, { superAdmin: true });

    const res = await agent
      .patch(`/api/admin/users/${otherSuperAdmin.id}/admin`)
      .send({ isAdmin: false });

    expect(res.status).toBe(400);
  });

  it("404s for a user id that doesn't exist", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });

    const res = await agent
      .patch("/api/admin/users/000000000000000000000000/admin")
      .send({ isAdmin: true });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/stats", () => {
  it("counts users, wines, tastings, and surfaces top users", async () => {
    const { agent, user: superAdmin } = await registerAgent();
    await grantAdmin(superAdmin.id, { superAdmin: true });

    const { agent: bobAgent, user: bob } = await registerAgent();
    const wineRes = await bobAgent.post("/api/wines").send({
      name: "Test Wine",
      producer: "Test Producer",
      country: "Testland",
      grape: "Testgrape",
      vintage: 2020,
    });
    await bobAgent.post("/api/tastings").send({
      wineId: wineRes.body._id,
      appearance: "Ruby",
      noseNotes: [],
      palateNotes: [],
      sweetness: 2,
      acidity: 2,
      body: 2,
      tannin: 2,
      rating: 4,
    });
    await agent.post(`/api/users/${bob.id}/follow`);

    const res = await agent.get("/api/admin/stats");

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(2);
    expect(res.body.totalWines).toBe(1);
    expect(res.body.totalTastings).toBe(1);
    expect(res.body.totalVisits).toBe(0);
    expect(res.body.newUsersThisWeek).toBe(2);
    expect(res.body.topByFollowers[0]).toMatchObject({ username: bob.username, followersCount: 1 });
    expect(res.body.topByTastings[0]).toMatchObject({ username: bob.username, tastingsCount: 1 });
  });
});
