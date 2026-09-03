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
  await agent.post("/api/auth/register").send({
    name: `Taster ${userCounter}`,
    email: `taster${userCounter}@example.com`,
    password: "supersecret123",
  });
  return agent;
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
  it("blocks wine and tasting routes without a session", async () => {
    const wines = await request(app).get("/api/wines");
    const tastings = await request(app).get("/api/tastings");

    expect(wines.status).toBe(401);
    expect(tastings.status).toBe(401);
  });
});

describe("Wines: shared catalog", () => {
  it("lets any logged-in user see wines another user created", async () => {
    const agentA = await registerAgent();
    const agentB = await registerAgent();

    const wine = await createWine(agentA);

    const listRes = await agentB.get("/api/wines");
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((w) => w._id === wine._id)).toBe(true);
  });
});

describe("Tastings: private per user", () => {
  it("only lists a user's own tastings", async () => {
    const agentA = await registerAgent();
    const agentB = await registerAgent();
    const wine = await createWine(agentA);

    await agentA.post("/api/tastings").send({ ...baseTasting, wineId: wine._id });

    const aList = await agentA.get("/api/tastings");
    const bList = await agentB.get("/api/tastings");

    expect(aList.body.tastings).toHaveLength(1);
    expect(bList.body.tastings).toHaveLength(0);
  });

  it("never trusts a client-supplied userId", async () => {
    const agentA = await registerAgent();
    const agentB = await registerAgent();
    const wine = await createWine(agentA);

    const meRes = await agentB.get("/api/auth/me");
    const createRes = await agentA
      .post("/api/tastings")
      .send({ ...baseTasting, wineId: wine._id, userId: meRes.body.user.id });

    expect(createRes.status).toBe(201);

    const aList = await agentA.get("/api/tastings");
    const bList = await agentB.get("/api/tastings");
    expect(aList.body.tastings).toHaveLength(1);
    expect(bList.body.tastings).toHaveLength(0);
  });

  it("blocks reading, updating, and deleting another user's tasting", async () => {
    const agentA = await registerAgent();
    const agentB = await registerAgent();
    const wine = await createWine(agentA);

    const createRes = await agentA
      .post("/api/tastings")
      .send({ ...baseTasting, wineId: wine._id });
    const tastingId = createRes.body._id;

    const bGet = await agentB.get(`/api/tastings/${tastingId}`);
    const bUpdate = await agentB
      .put(`/api/tastings/${tastingId}`)
      .send({ ...baseTasting, wineId: wine._id, rating: 1 });
    const bDelete = await agentB.delete(`/api/tastings/${tastingId}`);

    expect(bGet.status).toBe(404);
    expect(bUpdate.status).toBe(404);
    expect(bDelete.status).toBe(404);

    const aDelete = await agentA.delete(`/api/tastings/${tastingId}`);
    expect(aDelete.status).toBe(200);
  });

  it("validates required fields", async () => {
    const agentA = await registerAgent();
    const wine = await createWine(agentA);

    const res = await agentA.post("/api/tastings").send({ wineId: wine._id });
    expect(res.status).toBe(400);
  });
});
