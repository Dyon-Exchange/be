import Asset from "../src/models/Asset";
import Token from "../src/models/Token";
import User from "../src/models/User";

export async function setupUsers() {
  await User.create({
    email: "conor@labrys.io",
    password: "password",
    cashBalance: 250000,
    firstName: "Matilda",
    lastName: "Khuu",
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
  await Asset.create({
    year: "2021",
    name: "Example Spirit 1",
    productIdentifier: "012481629210681750",
  });
  await Asset.create({
    year: "2022",
    name: "Example Spirit 2",
    productIdentifier: "012481621010681750",
  });
  await Asset.create({
    year: "2023",
    name: "Example Spirit 3",
    productIdentifier: "112481620010681759",
  });
}

export async function tearDownAssets() {
  await Asset.remove({});
}
