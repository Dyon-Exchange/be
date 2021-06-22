import Asset from "../src/models/Asset";
import Token from "../src/models/Token";
import User from "../src/models/User";
import LimitOrder from "../src/models/LimitOrder";
import MarketOrder from "../src/models/MarketOrder";
const request = require("supertest");
import app from "../src/app";

let usersAlreadySetup = false;
let assetsAlreadySetup = false;

export async function setupUsers() {
  if (usersAlreadySetup) {
    return;
  } else {
    usersAlreadySetup = true;
  }

  try {
    await User.create({
      email: "conor@labrys.io",
      password: "password",
      cashBalance: 2500000000,
      firstName: "Conor",
      lastName: "Brosnan",
      assets: [],
    });

    await User.create({
      email: "matilda@labrys.io",
      password: "password",
      cashBalance: 250000,
      firstName: "Matilda",
      lastName: "Khuu",
      assets: [],
    });
  } catch (e) {
    console.log(e);
  }
}

export async function tearDownUsers() {
  await User.remove({});
}

export async function setupTokens() {
  const productCode = "012481620010600750";
  const caseId = "09301233";
  const locationId = "001";
  const taxCode = "001";
  const conditionCode = "029";

  await Token.create({
    productCode,
    caseId,
    locationId,
    taxCode,
    conditionCode,
    tokenId: `${productCode}${caseId}${locationId}${taxCode}${conditionCode}`,
    productIdentifier: `${productCode}${locationId}${taxCode}${conditionCode}`,
    supply: 10,
  });
}

export async function teardownTokens() {
  await Token.remove({});
  await tearDownAssets();
}

export async function setupAssets() {
  if (assetsAlreadySetup) {
    return;
  }
  assetsAlreadySetup = true;

  const asset1 = await Asset.create({
    year: "2021",
    name: "Example Spirit 1",
    productIdentifier: "012481629210681750",
    unitSize: "(6x75cl)",
  });
  const asset2 = await Asset.create({
    year: "2022",
    name: "Example Spirit 2",
    productIdentifier: "012481621010681750",
    unitSize: "(6x75cl)",
  });

  const asset3 = await Asset.create({
    year: "2023",
    name: "Example Spirit 3",
    productIdentifier: "112481620010681759",
    unitSize: "(6x75cl)",
  });

  const asset4 = await Asset.create({
    year: "2047",
    name: "Example Spirit 4",
    productIdentifier: "112461626819686123",
    unitSize: "(6x75cl)",
  });

  const asset5 = await Asset.create({
    year: "2019",
    name: "Example 5",
    productIdentifier: "271829302982738492",
    unitSize: "unit",
  });

  const asset6 = await Asset.create({
    year: "2019",
    name: "Example 5",
    productIdentifier: "271828843927289292",
    unitSize: "unit",
  });

  const asset7 = await Asset.create({
    year: "2019",
    name: "Example 6",
    productIdentifier: "274828888888889292",
    unitSize: "absolute unit",
  });

  const asset8 = await Asset.create({
    year: "2020",
    name: "Example 7",
    productIdentifier: "282882730981236773",
    unitSize: "abolute unit",
  });

  const asset9 = await Asset.create({
    year: "2020",
    name: "Example 7",
    productIdentifier: "182882730280236773",
    unitSize: "abolute unit",
  });

  const asset10 = await Asset.create({
    year: "2020",
    name: "Example 7",
    productIdentifier: "082882730981236773",
    unitSize: "abolute unit",
  });

  const asset11 = await Asset.create({
    year: "2020",
    name: "Example 7",
    productIdentifier: "923882730981236773",
    unitSize: "abolute unit",
  });

  const asset12 = await Asset.create({
    year: "2020",
    name: "Example 10 ",
    productIdentifier: "283920182738498448",
    unitSize: "absolute unit",
  });

  const asset13 = await Asset.create({
    year: "2021",
    name: "Example 12",
    productIdentifier: "2938392910292783838",
    unitSize: "absolute unit",
  });

  const asset14 = await Asset.create({
    year: "2021",
    name: "Example 12",
    productIdentifier: "293839291111111183",
    unitSize: "absolute unit",
  });

  const asset15 = await Asset.create({
    year: "2021",
    name: "Example 12",
    productIdentifier: "293839291111111181",
    unitSize: "absolute unit",
  });

  const user = await User.findOne({ email: "conor@labrys.io" });
  if (!user) {
    throw new Error();
  }

  user.assets = [
    { productIdentifier: asset1.productIdentifier, quantity: 20 },
    { productIdentifier: asset2.productIdentifier, quantity: 20 },
    { productIdentifier: asset4.productIdentifier, quantity: 20 },
    { productIdentifier: asset5.productIdentifier, quantity: 50 },
    { productIdentifier: asset6.productIdentifier, quantity: 20 },
    { productIdentifier: asset7.productIdentifier, quantity: 50 },
    { productIdentifier: asset8.productIdentifier, quantity: 50 },
    { productIdentifier: asset9.productIdentifier, quantity: 50 },
    { productIdentifier: asset10.productIdentifier, quantity: 50 },
    { productIdentifier: asset11.productIdentifier, quantity: 50 },
    { productIdentifier: asset12.productIdentifier, quantity: 50 },
    { productIdentifier: asset13.productIdentifier, quantity: 50 },
    { productIdentifier: asset14.productIdentifier, quantity: 50 },
    { productIdentifier: asset15.productIdentifier, quantity: 50 },
  ];
  await user.save();

  const user1 = await User.findOne({ email: "matilda@labrys.io" });
  if (!user1) {
    throw new Error();
  }

  user1.assets = [
    {
      productIdentifier: asset2.productIdentifier,
      quantity: 20,
    },
  ];
  await user1.save();
}

export async function tearDownAssets() {
  await Asset.remove({});
}

export async function getLoginToken(): Promise<string[]> {
  const response = await request(app.callback()).post("/user/login").send({
    email: "conor@labrys.io",
    password: "password",
  });

  const response2 = await request(app.callback()).post("/user/login").send({
    email: "matilda@labrys.io",
    password: "password",
  });

  return [response.body.token, response2.body.token];
}

export async function tearDownOrders() {
  await LimitOrder.remove({});
  await MarketOrder.remove({});
}
