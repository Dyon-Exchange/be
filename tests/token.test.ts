const request = require("supertest");
import app from "../src/app";
import { setupTokens, teardownTokens } from "./setup";

beforeAll(async () => {
  await setupTokens();
});

afterAll(async () => {
  await teardownTokens();
});

test("Test PUT token", async () => {
  const response = await request(app.callback()).put("/token/").send({
    productCode: "101231627017600750",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "029",
    year: "2021",
    name: "Example spirit",
  });

  expect(response.status).toBe(200);
});

test("Test PUT token same id", async () => {
  let response = await request(app.callback()).put("/token/").send({
    productCode: "101231620010600750",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "029",
    year: "2021",
    name: "Example spirit",
  });

  response = await request(app.callback()).put("/token/").send({
    productCode: "101231620010600750",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "029",
    year: "2021",
    name: "Example spirit",
  });

  expect(response.status).toBe(400);
});

test("Test PUT token invalid values", async () => {
  const response = await request(app.callback()).put("/token/").send({
    productCode: "abcdefghifs",
    caseId: "qwertyuip",
    locationId: "jkashdfajs",
    taxCode: "aljshdf",
    conditionCode: "jashdfsd",
    year: "2021",
    name: "Example spirit",
  });
  expect(response.status).toBe(400);
});

test("Test GET token", async () => {
  const response = await request(app.callback()).get(
    "/token/01248162001060075009301233001001029"
  );
  expect(response.body).toHaveProperty("productCode");
  expect(response.body).toHaveProperty("caseId");
  expect(response.body).toHaveProperty("locationId");
  expect(response.body).toHaveProperty("taxCode");
  expect(response.body).toHaveProperty("conditionCode");
  expect(response.body).toHaveProperty("tokenId");
});

test("Test GET token with invalid id", async () => {
  const response = await request(app.callback()).get(
    "/token/012481620010600750093012330010082921"
  );
  expect(response.status).toBe(404);
});

test("Test GET token metadata", async () => {
  const response = await request(app.callback()).get(
    "/token/metadata/01248162001060075009301233001001029.json"
  );

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("productCode");
  expect(response.body).toHaveProperty("caseId");
  expect(response.body).toHaveProperty("locationId");
  expect(response.body).toHaveProperty("taxCode");
  expect(response.body).toHaveProperty("conditionCode");
});
