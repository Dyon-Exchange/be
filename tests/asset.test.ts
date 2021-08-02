import request from "supertest";
import app from "../src/app";
import User from "../src/models/User";
import LimitOrder from "../src/models/LimitOrder";
import { OrderSide, OrderStatus } from "../src/models/Order";
import Asset from "../src/models/Asset";
import {
  getLoginToken,
  setupAssets,
  setupUsers,
  tearDownAssets,
} from "./setup";
import { getRand } from "../src/routes/asset";

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
  expect(user.assets.length).toBe(14);
});

export async function CreateAsset(pc: string) {
  const asset = await Asset.create({
    productIdentifier: pc,
    year: "2020",
    name: "Example asset",
    details: {
      blurb: "",
      colour: "",
      country: "",
      region: "",
      subRegion: "",
      wineAdvocate: "",
      decanter: "",
      jamesSuckling: "",
      jebDunnuck: "",
      vinous: "",
    },
    unitSize: "(6x75cl)",
    image: "",
    changeAmount: "",
    changePercentage: "",
  });
  return asset;
}

async function createOrder(
  pc: string,
  side: OrderSide,
  price: number,
  quantity: number
) {
  const user = await User.findOne({ email: "conor@labrys.io" });
  if (!user) {
    throw new Error();
  }
  const order = await LimitOrder.create({
    productIdentifier: pc,
    side,
    price,
    userId: user._id,
    quantity,
    orderId: pc + getRand(1, 10),
    status: "PENDING",
    filled: 0,
    matched: [],
    filledPriceTotal: 0,
    filledPriceAverage: 0,
  });
}

test("Get Best Buy Price no orders", async () => {
  const asset = await CreateAsset("012481629210681666");
  expect(await asset.getBestBuyPrice()).toBe(undefined);
});

test("Get Best Buy Price", async () => {
  const asset = await CreateAsset("012481629210681477");
  await createOrder(asset.productIdentifier, "ASK", 200, 1);
  await createOrder(asset.productIdentifier, "ASK", 100, 1);
  await createOrder(asset.productIdentifier, "ASK", 300, 1);
  expect(await asset.getBestBuyPrice()).toBe(300);
});

test("Get Best Buy Price all equal", async () => {
  const asset = await CreateAsset("234481629210681477");
  await createOrder(asset.productIdentifier, "ASK", 200, 1);
  await createOrder(asset.productIdentifier, "ASK", 200, 1);
  await createOrder(asset.productIdentifier, "ASK", 200, 1);
  expect(await asset.getBestBuyPrice()).toBe(200);
});

test("Get Best Buy Price fraction", async () => {
  const asset = await CreateAsset("437312349210691477");
  await createOrder(asset.productIdentifier, "ASK", 200, 0.1);
  await createOrder(asset.productIdentifier, "ASK", 300, 0.1);
  await createOrder(asset.productIdentifier, "ASK", 1500, 0.1);
  expect(await asset.getBestBuyPrice()).toBe(1500);
});

test("Get Best Sell Price no orders", async () => {
  const asset = await CreateAsset("437311238210691477");
  expect(await asset.getBestSellPrice()).toBe(undefined);
});

test("Get Best Sell Price", async () => {
  const asset = await CreateAsset("321311238210691477");
  await createOrder(asset.productIdentifier, "BID", 200, 1);
  await createOrder(asset.productIdentifier, "BID", 100, 1);
  await createOrder(asset.productIdentifier, "BID", 300, 1);
  expect(await asset.getBestSellPrice()).toBe(100);
});

test("Get Best Sell price all equal", async () => {
  const asset = await CreateAsset("321311222318681477");
  await createOrder(asset.productIdentifier, "BID", 200, 1);
  await createOrder(asset.productIdentifier, "BID", 200, 1);
  await createOrder(asset.productIdentifier, "BID", 200, 1);
  expect(await asset.getBestSellPrice()).toBe(200);
});

test("Get Best Sell price fraction", async () => {
  const asset = await CreateAsset("437322322222291477");
  await createOrder(asset.productIdentifier, "BID", 200, 0.1);
  await createOrder(asset.productIdentifier, "BID", 300, 0.1);
  await createOrder(asset.productIdentifier, "BID", 1500, 0.1);
  expect(await asset.getBestSellPrice()).toBe(200);
});
