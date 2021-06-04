const request = require("supertest");
import app from "../src/app";
import { setupAssets, tearDownAssets } from "./setup";

beforeAll(async () => {
  await setupAssets();
});

afterAll(async () => {
  await tearDownAssets();
});

test("GET", async () => {
  const response = await request(app.callback()).get("/asset/");
  expect(response.body).toHaveProperty("assets");
  expect(response.body.assets[0]).toHaveProperty("name");
  expect(response.body.assets[0]).toHaveProperty("year");
  expect(response.body.assets[0]).toHaveProperty("productIdentifier");
});
