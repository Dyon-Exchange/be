const request = require("supertest");
import User, { User as UserClass } from "../src/models/User";
import app from "../src/app";
import { CreateAsset } from "./asset.test";
import { createOrder } from "./order.test";
import { setupUsers, tearDownUsers } from "./setup";

beforeAll(async () => {
  await setupUsers();
});

afterAll(async () => {
  await tearDownUsers();
});

async function createUser(email: string) {
  const password = "password";
  return await User.create({
    email,
    password,
    cashBalance: 2500000000,
    firstName: "Test",
    lastName: "Test",
    assets: [],
  });
}

test("Test login with wrong method", async () => {
  const response = await request(app.callback()).get("/user/login");
  expect(response.status).toBe(405);
});

test("Test login with empty body", async () => {
  const response = await request(app.callback()).post("/user/login");
  expect(response.status).toBe(400);
});

test("Test login with garbage body", async () => {
  const response = await request(app.callback())
    .post("/user/login")
    .send({ garbage: "rubbish" });
  expect(response.status).toBe(400);
});

test("Test login with correct login details", async () => {
  const response = await request(app.callback()).post("/user/login").send({
    email: "conor@labrys.io",
    password: "password",
  });
  expect(response.body).toHaveProperty("token");
  expect(response.body).toHaveProperty("refreshToken");
});

test("Test login with incorrect login details", async () => {
  const response = await request(app.callback()).post("/user/login").send({
    email: "wrong@email.com",
    password: "wrong123",
  });
  expect(response.status).toBe(404);
});

// test("Test accessing private route with token", async () => {
//   let response = await request(app.callback()).post("/user/login").send({
//     email: "conor@labrys.io",
//     password: "password",
//   });

//   const { token } = response.body;

//   response = await request(app.callback())
//     .get("/user/test")
//     .set({
//       Authorization: `Bearer ${token}`,
//     });

//   expect(response.status).toBe(200);
// });

// test("Test accessing private route with no token", async () => {
//   const response = await request(app.callback()).get("/user/test");
//   expect(response.status).toBe(401);
// });

// test("Test accessing private route with invalid token", async () => {
//   const response = await request(app.callback()).get("/user/test").set({
//     Authorization: `Bearer not-a-token`,
//   });

//   expect(response.status).toBe(401);
// });

test("Test get user details of current user", async () => {
  let response = await request(app.callback()).post("/user/login").send({
    email: "conor@labrys.io",
    password: "password",
  });

  const { token } = response.body;

  response = await request(app.callback())
    .get("/user/")
    .set({
      Authorization: `Bearer ${token}`,
    });

  expect(response.body).toHaveProperty("fullName");
  expect(response.body).toHaveProperty("cashBalance");
  expect(response.body).toHaveProperty("email");
  expect(response.status).toBe(200);
});

test("Test get pending orders, ask order on other side", async () => {
  const user = (await User.findOne({ email: "conor@labrys.io" })) as UserClass;
  const productIdentifier = "012481607329721202";
  await CreateAsset(productIdentifier);
  await user.addAsset(productIdentifier, 10);

  // @ts-ignore
  await createOrder(productIdentifier, "ASK", 10, 10, user._id);
  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "BID")).toBe(
    true
  );
});

test("Test get pending orders, bid order on other side", async () => {
  const user = await createUser("test1@email.com");
  const productIdentifier = "111111607329721202";
  await CreateAsset(productIdentifier);
  await user.addAsset(productIdentifier, 10);

  await createOrder(productIdentifier, "BID", 10, 10, user._id);
  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "ASK")).toBe(
    true
  );
});

test("Test get pending orders, user has no orders", async () => {
  const user = await createUser("test2@email.com");
  const productIdentifier = "123711607329721202";
  await CreateAsset(productIdentifier);
  await user.addAsset(productIdentifier, 10);

  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "ASK")).toBe(
    false
  );
  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "BID")).toBe(
    false
  );
});

test("Test get pending orders, no bid order on other side", async () => {
  const user = await createUser("test3@email.com");
  const productIdentifier = "123711622889721202";
  await CreateAsset(productIdentifier);
  await user.addAsset(productIdentifier, 10);
  await createOrder(productIdentifier, "ASK", 10, 10, user._id);
  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "ASK")).toBe(
    false
  );
});

test("Test get pending orders, no ask order on other side", async () => {
  const user = await createUser("test4@email.com");
  const productIdentifier = "123712982889721202";
  await CreateAsset(productIdentifier);
  await user.addAsset(productIdentifier, 10);
  await createOrder(productIdentifier, "BID", 10, 10, user._id);
  expect(await user.hasPendingOrderOnOtherSide(productIdentifier, "BID")).toBe(
    false
  );
});
