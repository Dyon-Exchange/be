import request from "supertest";
import app from "../src/app";
import User from "../src/models/User";
import {
  getLoginToken,
  setupAssets,
  setupUsers,
  tearDownAssets,
} from "./setup";

beforeAll(async () => {
  await setupUsers();
  await setupAssets();
});

afterAll(async () => {
  await tearDownAssets();
});

test("GET", async () => {
  const [token] = await getLoginToken();
  const response = await request(app.callback())
    .get("/asset/")
    .set({
      Authorization: `Bearer ${token}`,
    });

  expect(response.body).toHaveProperty("assets");
  expect(response.body.assets[0]).toHaveProperty("name");
  expect(response.body.assets[0]).toHaveProperty("year");
  expect(response.body.assets[0]).toHaveProperty("productIdentifier");
});

test("GET user assets", async () => {
  const [token] = await getLoginToken();
  const response = await request(app.callback())
    .get("/asset/user")
    .set({
      Authorization: `Bearer ${token}`,
    });

  const userAssets = response.body.assets;
  expect(userAssets[0].asset.name).toBe("Example Spirit 1");
  expect(userAssets[1].asset.name).toBe("Example Spirit 2");
});

test("PUT user asset", async () => {
  const [token] = await getLoginToken();
  const response = await request(app.callback())
    .put("/asset/user")
    .set({ Authorization: `Bearer ${token}` })
    .send({
      productIdentifier: "012481629210681750",
      quantity: 10,
    });

  expect(response.status).toBe(200);

  const user = await User.findOne({ email: "conor@labrys.io" });
  if (!user) {
    throw new Error();
  }
  expect(user.assets.length).toBe(3);
});
