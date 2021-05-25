const request = require("supertest");
import app from "../src/app";

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
    password: "password2021",
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

test("Test accessing private route with token", async () => {
  let response = await request(app.callback()).post("/user/login").send({
    email: "conor@labrys.io",
    password: "password2021",
  });

  const { token } = response.body;

  response = await request(app.callback())
    .get("/user/test")
    .set({
      Authorization: `Bearer ${token}`,
    });

  expect(response.status).toBe(200);
});

test("Test accessing private route with no token", async () => {
  const response = await request(app.callback()).get("/user/test");
  expect(response.status).toBe(401);
});

test("Test accessing private route with invalid token", async () => {
  const response = await request(app.callback()).get("/user/test").set({
    Authorization: `Bearer not-a-token`,
  });

  expect(response.status).toBe(401);
});