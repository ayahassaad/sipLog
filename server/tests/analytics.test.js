process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../server");
const SiteStat = require("../models/SiteStat");
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

describe("POST /api/analytics/visit", () => {
  it("works without being logged in and starts the counter at 1", async () => {
    const res = await request(app).post("/api/analytics/visit");

    expect(res.status).toBe(204);
    const stat = await SiteStat.findById("site");
    expect(stat.totalVisits).toBe(1);
  });

  it("increments on every call", async () => {
    await request(app).post("/api/analytics/visit");
    await request(app).post("/api/analytics/visit");
    await request(app).post("/api/analytics/visit");

    const stat = await SiteStat.findById("site");
    expect(stat.totalVisits).toBe(3);
  });
});
