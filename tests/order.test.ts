import request from "supertest";
import app from "../src/app";
import {
  getLoginToken,
  setupAssets,
  setupUsers,
  tearDownAssets,
  tearDownOrders,
  tearDownUsers,
} from "./setup";
import Order, { LimitOrder } from "../src/models/LimitOrder";
import User from "../src/models/User";

beforeAll(async () => {
  await setupUsers();
  await setupAssets();
});

// afterEach(async () => {
//   await tearDownOrders();
//   await tearDownAssets();
//   await tearDownUsers();
// });

async function getUsers() {
  const [user] = await User.find({ email: "conor@labrys.io" });
  const [user1] = await User.find({ email: "matilda@labrys.io" });
  return [user, user1];
}

async function sendLimitOrder(
  productIdentifier: string,
  side: string,
  quantity: number,
  price: number,
  token: string,
  allowErr: boolean = false
) {
  const res = await request(app.callback())
    .put("/order/limitOrder")
    .set({
      Authorization: `Bearer ${token}`,
    })
    .send({
      productIdentifier,
      side,
      quantity,
      price,
    });
  if (res.status !== 200 && !allowErr) {
    throw new Error(res.text);
  }
  return res;
}

async function giveUserAsset(
  productIdentifier: string,
  quantity: number,
  token: string
) {
  const response = await request(app.callback())
    .put("/asset/user")
    .set({
      Authorization: `Bearer ${token}`,
    })
    .send({
      productIdentifier,
      quantity,
    });
}

async function checkUserAssetQuantity(
  productIdentifier: string,
  token: string
) {
  const response = await request(app.callback())
    .get("/asset/user")
    .set({
      Authorization: `Bearer ${token}`,
    });

  const asset = response.body.assets.filter(
    (a: any) => productIdentifier === a.productIdentifier
  )[0];

  if (asset) {
    return asset.quantity;
  } else {
    return 0;
  }
}

test("Limit order gets filled and user quantity updated, second user doesn't own any of asset", async () => {
  const [token, token2] = await getLoginToken();
  const productIdentifier = "012481629210681750";

  let q1 = await checkUserAssetQuantity(productIdentifier, token);
  let q2 = await checkUserAssetQuantity(productIdentifier, token2);
  expect(q1).toBe(20);
  expect(q2).toBe(0);

  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);

  await sendLimitOrder(productIdentifier, "BID", 10, 10, token2);

  const [user] = await User.find({ email: "conor@labrys.io" });
  const [user1] = await User.find({ email: "matilda@labrys.io" });
  const [order] = await Order.find({ userId: user._id });
  const [order2] = await Order.find({ userId: user1._id });

  expect(order.status).toBe("COMPLETE");
  expect(order2.status).toBe("COMPLETE");

  q1 = await checkUserAssetQuantity(productIdentifier, token);
  q2 = await checkUserAssetQuantity(productIdentifier, token2);
  expect(q1).toBe(10);
  expect(q2).toBe(10);
});

test("Limit order gets filled, second user owns some of asset", async () => {
  const [token, token2] = await getLoginToken();
  const productIdentifier = "012481621010681750";

  let q1 = await checkUserAssetQuantity(productIdentifier, token);
  let q2 = await checkUserAssetQuantity(productIdentifier, token2);
  expect(q1).toBe(20);
  expect(q2).toBe(20);

  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);
  await sendLimitOrder(productIdentifier, "BID", 10, 10, token2);

  const [user] = await User.find({ email: "conor@labrys.io" });
  const [user1] = await User.find({ email: "matilda@labrys.io" });
  const [order1] = await Order.find({ userId: user._id, productIdentifier });
  const [order2] = await Order.find({ userId: user1._id, productIdentifier });

  q1 = await checkUserAssetQuantity(productIdentifier, token);
  q2 = await checkUserAssetQuantity(productIdentifier, token2);

  expect(q1).toBe(10);
  expect(q2).toBe(30);
  expect(order1.status).toBe("COMPLETE");
  expect(order2.status).toBe("COMPLETE");
});

test("Test ASK Limit Order, user doesn't own amount trying to sell", async () => {
  const [token] = await getLoginToken();
  const productIdentifier = "112481620010681759";

  let q1 = await checkUserAssetQuantity(productIdentifier, token);
  expect(q1).toBe(0);

  const response = await sendLimitOrder(
    productIdentifier,
    "ASK",
    10,
    10,
    token,
    true
  );
  expect(response.status).toBe(400);
  expect(response.text).toBe(
    "User does not have enough asset to sell that quantity"
  );
});

test("Test BID with no cash balance", async () => {
  const [token] = await getLoginToken();
  const productIdentifier = "112481620010681759";

  await User.findOneAndUpdate(
    {
      email: "conor@labrys.io",
    },
    { $set: { cashBalance: 10 } }
  );

  const res = await sendLimitOrder(
    productIdentifier,
    "BID",
    10,
    10,
    token,
    true
  );
  expect(res.status).toBe(400);
  expect(res.text).toBe(
    "User does not have enough cash to make this order 100 > 10"
  );

  // reset the balance for other tests
  await User.findOneAndUpdate(
    {
      email: "conor@labrys.io",
    },
    { $set: { cashBalance: 250000000 } }
  );
});

test("Test Limit Order partially filled", async () => {
  const [token, token2] = await getLoginToken();
  const productIdentifier = "271829302982738492";
  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);

  await sendLimitOrder(productIdentifier, "BID", 5, 10, token2);

  const [user] = await User.find({ email: "conor@labrys.io" });
  const [user1] = await User.find({ email: "matilda@labrys.io" });
  const [order] = await Order.find({
    status: "PENDING",
    userId: user._id,
    productIdentifier,
  });
  const [order2] = await Order.find({
    status: "COMPLETE",
    userId: user1._id,
    productIdentifier,
  });

  expect(order.filled).toBe(5);
  expect(order2.filled).toBe(5);
});

test("Test Limit Order partially filled, gets fully filled and completed", async () => {
  const [token, token2] = await getLoginToken();
  const productIdentifier = "112461626819686123";

  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);

  await sendLimitOrder(productIdentifier, "BID", 5, 10, token2);

  const [user, user1] = await getUsers();

  const [order] = await Order.find({
    status: "PENDING",
    userId: user._id,
    productIdentifier,
  });
  const [order2] = await Order.find({
    status: "COMPLETE",
    userId: user1._id,
    productIdentifier,
  });

  expect(order.filled).toBe(5);
  expect(order2.filled).toBe(5);
  expect(await checkUserAssetQuantity(productIdentifier, token)).toBe(15);
  expect(await checkUserAssetQuantity(productIdentifier, token2)).toBe(5);

  await sendLimitOrder(productIdentifier, "BID", 5, 10, token2);
  const orders = await Order.find({
    status: "COMPLETE",
    userId: user1._id,
    productIdentifier,
  });
  orders.map((order) => {
    expect(order.filled).toBe(5);
    expect(order.quantity).toBe(5);
  });

  const [secondOrder] = await Order.find({
    status: "COMPLETE",
    userId: user._id,
    productIdentifier,
  });
  expect(secondOrder.filled).toBe(10);
  expect(secondOrder.quantity).toBe(10);
  expect(await checkUserAssetQuantity(productIdentifier, token)).toBe(10);
  expect(await checkUserAssetQuantity(productIdentifier, token2)).toBe(10);
});

test("Test cancel Limit order", async () => {
  const [token] = await getLoginToken();
  const [user] = await getUsers();
  const productIdentifier = "271828843927289292";

  await sendLimitOrder(productIdentifier, "BID", 10, 10, token);
  const [order] = await Order.find({
    productIdentifier,
    userId: user._id,
    status: "PENDING",
    side: "BID",
  });
  const response = await request(app.callback())
    .post("/order/cancelOrder")
    .send({ orderId: order.orderId })
    .set({ Authorization: `Bearer ${token}` });
  const [order2] = await Order.find({ orderId: order.orderId });
  expect(order2.status).toBe("CANCELED");
});

test("User cannot cancel order that isn't theirs", async () => {
  const [token, token2] = await getLoginToken();
  const [user] = await getUsers();
  const productIdentifier = "271829302982738492";

  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);

  const [order] = await Order.find({
    status: "PENDING",
    productIdentifier,
    userId: user._id,
    side: "ASK",
  });

  const response = await request(app.callback())
    .post("/order/cancelOrder")
    .send({ orderId: order.orderId })
    .set({ Authorization: `Bearer ${token2}` });

  expect(response.status).toBe(403);
});

test("User cannot cancel completed order", async () => {
  const [token, token2] = await getLoginToken();
  const [user, user2] = await getUsers();
  const productIdentifier = "271829302982738492";

  await sendLimitOrder(productIdentifier, "BID", 29, 15, token2);
  await sendLimitOrder(productIdentifier, "ASK", 29, 15, token);

  const [order] = await Order.find({
    productIdentifier,
    userId: user2._id,
    side: "BID",
    quantity: 29,
    price: 15,
  });
  expect(order.status).toBe("COMPLETE");

  const res = await request(app.callback())
    .post("/order/cancelOrder")
    .send({ orderId: order.orderId })
    .set({ Authorization: `Bearer ${token2}` });

  expect(res.status).toBe(400);
  expect(res.text).toBe("Cannot cancel completed order");
});

test("Test calculate market price", async () => {
  const [token] = await getLoginToken();
  const [user] = await getUsers();

  const productIdentifier = "274828888888889292";

  await sendLimitOrder(productIdentifier, "BID", 20, 5, token);
  await sendLimitOrder(productIdentifier, "BID", 5, 15, token);
  await sendLimitOrder(productIdentifier, "BID", 15, 20, token);

  const response = await request(app.callback())
    .post("/order/calculateMarketPrice")
    .send({
      productIdentifier,
      quantity: 1,
      side: "ASK",
    })
    .set({ Authorization: `Bearer ${token}` });
  expect(Number(response.body.price)).toBe(20);
});

test("User cash balances update", async () => {
  const [token, token2] = await getLoginToken();

  let [user, user2] = await getUsers();
  const initUser = user.cashBalance;
  const initUser2 = user2.cashBalance;
  const productIdentifier = "182882730280236773";

  await sendLimitOrder(productIdentifier, "ASK", 10, 10, token);
  await sendLimitOrder(productIdentifier, "BID", 10, 10, token2);

  [user, user2] = await getUsers();
  expect(user.cashBalance).toBe(initUser + 100);
  expect(user2.cashBalance).toBe(initUser2 - 100);
});

test("User cash balances update higher bid higher than ask", async () => {
  const [token, token2] = await getLoginToken();
  let [user, user2] = await getUsers();
  const initUser = user.cashBalance;
  const initUser2 = user2.cashBalance;
  const productIdentifier = "082882730981236773";
  await sendLimitOrder(productIdentifier, "ASK", 1, 15, token);
  await sendLimitOrder(productIdentifier, "BID", 1, 20, token2);

  [user, user2] = await getUsers();
  expect(user.cashBalance).toBe(initUser + 15);
  expect(user2.cashBalance).toBe(initUser2 - 15);
});

test("User cash balances update higher ask than bid", async () => {
  const [token, token2] = await getLoginToken();
  let [user, user2] = await getUsers();
  const initUser = user.cashBalance;
  const initUser2 = user2.cashBalance;
  const productIdentifier = "923882730981236773";

  await sendLimitOrder(productIdentifier, "BID", 1, 15, token2);
  await sendLimitOrder(productIdentifier, "ASK", 1, 10, token);

  [user, user2] = await getUsers();
  expect(user.cashBalance).toBe(initUser + 15);
  expect(user2.cashBalance).toBe(initUser2 - 15);
});

test("User cash balances update, user's order only partially filled", async () => {
  const [token, token2] = await getLoginToken();
  let [user, user2] = await getUsers();
  const initUser = user.cashBalance;
  const initUser2 = user2.cashBalance;

  const productIdentifier = "283920182738498448";

  await sendLimitOrder(productIdentifier, "ASK", 4, 10, token);
  await sendLimitOrder(productIdentifier, "BID", 1, 15, token2);

  let bidOrder = await Order.findOne({
    productIdentifier,
    side: "ASK",
    userId: user._id,
    quantity: 4,
    price: 10,
  });
  if (!bidOrder) {
    throw new Error();
  }

  [user, user2] = await getUsers();
  expect(user.cashBalance).toBe(initUser + 10);
  expect(user2.cashBalance).toBe(initUser2 - 10);
  expect(bidOrder.filled).toBe(1);

  await sendLimitOrder(productIdentifier, "BID", 2, 15, token2);
  bidOrder = await Order.findById(bidOrder._id);
  if (!bidOrder) {
    throw new Error();
  }
  expect(bidOrder.filled).toBe(3);
});

test("User cash balances update, order only partially fills other order", async () => {
  const [token, token2] = await getLoginToken();
  let [user, user2] = await getUsers();
  const initUser = user.cashBalance;
  const initUser2 = user2.cashBalance;

  const productIdentifier = "293839291111111183";

  await sendLimitOrder(productIdentifier, "ASK", 1, 10, token);
  await sendLimitOrder(productIdentifier, "BID", 2, 10, token2);

  [user, user2] = await getUsers();
  expect(user.cashBalance).toBe(initUser + 10);
  expect(user2.cashBalance).toBe(initUser2 - 10);
});
