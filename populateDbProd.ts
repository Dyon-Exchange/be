import User from "./src/models/User";
import Asset from "./src/models/Asset";
import Token from "./src/models/Token";
import config from "./src/config";
import orderbook from "./src/services/orderbook";
import database from "./src/services/database";
import LimitOrder from "./src/models/LimitOrder";

function Image(productIdentifier: string) {
  return `https://storage.googleapis.com/dyon/product-images/${productIdentifier}.png`;
}

async function AddUsers() {
  const password = "password";
  await User.create({
    email: "conor@labrys.io",
    password,
    cashBalance: 100000,
    firstName: "Conor",
    lastName: "Brosnan",
    assets: [],
  });

  await User.create({
    email: "matilda@labrys.io",
    password,
    cashBalance: 100000,
    firstName: "Matilda",
    lastName: "K",
    assets: [],
  });

  await User.create({
    email: "jeremy@dyon.com",
    password,
    cashBalance: 100000,
    firstName: "Jeremy",
    lastName: "Howard",
    assets: [],
  });

  await User.create({
    email: "alice@dyon.com",
    password,
    cashBalance: 100000,
    firstName: "Alice",
    lastName: "Smith",
    assets: [],
  });

  await User.create({
    email: "bob@dyon.com",
    password,
    cashBalance: 100000,
    firstName: "Bob",
    lastName: "Smith",
    assets: [],
  });
}

type CreateAsset = {
  productCode: string;
  caseId: string;
  locationId: string;
  taxCode: string;
  conditionCode: string;
  name: string;
  year: string;
  image: string;
  supply: number;
  blurb: string;
};

async function CreateAssetAndToken(a: CreateAsset) {
  let txHash = "my-tx-hash";
  // const response = await Contract.mint(
  //   BigNumber.from(`${a.productCode}${a.caseId}${a.locationId}${a.taxCode}`),
  //   a.supply
  // )
  //await response.wait();
  //txHash = response.hash;

  const asset = await Asset.create({
    productIdentifier: a.productCode,
    year: a.year,
    name: a.name,
    details: { blurb: a.blurb },
    unitSize: "(6x75cl)",
    image: a.image,
  });

  const token = await Token.create({
    productCode: a.productCode,
    caseId: a.caseId,
    locationId: a.locationId,
    conditionCode: a.conditionCode,
    taxCode: "001",
    tokenId: `${a.productCode}${a.caseId}${a.locationId}${a.taxCode}${a.conditionCode}`,
    productIdentifier: `${a.productCode}${a.locationId}${a.taxCode}${a.conditionCode}`,
    supply: a.supply,
  });
}

async function AddAssetProd() {
  await CreateAssetAndToken({
    productCode: "101231620010600750",
    year: "2001",
    caseId: "00000003",
    locationId: "000",
    taxCode: "030",
    conditionCode: "010",
    name: "Latour",
    image: Image("101231620010600750"),
    blurb:
      "Château Latour is one of Bordeaux's – and the world's – most famous wine producers. It is situated in the southeast corner of the Pauillac commune on the border of Saint-Julien, in the Médoc region. Rated as a First Growth in the 1855 Bordeaux Classification, it has become one of the most sought-after and expensive wine producers on the planet, and produces powerfully structured Cabernet Sauvignon-dominant wines capable of lasting many decades.",
    supply: 15,
  });

  await CreateAssetAndToken({
    productCode: "101187220001200750",
    year: "2000",
    caseId: "00000001",
    locationId: "000",
    taxCode: "030",
    conditionCode: "010",
    name: "Lafite",
    image: Image("101187220001200750"),
    blurb:
      "Château Lafite Rothschild is a wine estate in France, owned by members of the Rothschild family since the 19th century. The name Lafite comes from the surname of the La Fite family. Lafite was one of four wine-producing châteaux of Bordeaux originally awarded First Growth status in the 1855 Classification, which was based on the prices and wine quality at that time. Since then, it has been a consistent producer of one of the world's most expensive red wines.",
    supply: 15,
  });

  await CreateAssetAndToken({
    productCode: "102867419650100750",
    name: "Domaine de la Romanee-Conti Richebourg Grand Cru",
    year: "1965",
    caseId: "00000001",
    locationId: "000",
    taxCode: "030",
    conditionCode: "010",
    image: Image("102867419650100750"),
    blurb:
      "Domaine de la Romanée-Conti, often abbreviated to DRC, is an estate in Burgundy, France that produces white and red wine. It is widely considered among the world's greatest wine producers, and DRC bottles are among the world's most expensive. It takes its name from the domaine's most famous vineyard, Romanée-Conti.",
    supply: 15,
  });

  await CreateAssetAndToken({
    productCode: "100428520130600750",
    name: "Penfolds Grange",
    year: "2013",
    caseId: "00000006",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    image: Image("100428520130600750"),
    blurb:
      "Penfolds Grange (until the 1989 vintage labelled Penfolds Grange Hermitage) is an Australian wine, made predominantly from the Shiraz (Syrah) grape and usually a small percentage of Cabernet Sauvignon. It is widely considered one of Australia's 'first growth' and its most collectable wine.[1] The term 'Hermitage', the name of a French wine appellation, was commonly used in Australia as another synonym for Shiraz or Syrah. Penfolds is owned by Treasury Wine Estates.",
    supply: 15,
  });

  await CreateAssetAndToken({
    productCode: "108254220080600750",
    name: "Louis Roederer Cristal",
    year: "2008",
    caseId: "00000365",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    image: Image("108254220080600750"),
    blurb:
      "Cristal is the flagship cuvée of Champagne Louis Roederer, created in 1876 for Alexander II, tsar of Russia.",
    supply: 15,
  });

  await CreateAssetAndToken({
    productCode: "104380020160300750",
    name: "Domaine Leroy Chambertin Grand Cru",
    year: "2016",
    locationId: "001",
    taxCode: "001",
    image: Image("104380020160300750"),
    caseId: "00000009",
    conditionCode: "001",
    blurb:
      "Domaine Leroy is a vineyard estate which produces red Burgundy. The domaine has always produced biodynamic wine, and is certified by ECOCERT. Lalou Bize-Leroy of Domaine Leroy also owns a quarter of Domaine de la Romanée-Conti. The domaine has 23 hectares of vines, mostly Premier Cru and Grand Cru classified.",
    supply: 15,
  });
}

(async () => {
  //process.env.NODE_ENV = "test";
  //config.mongoConnectionUrl = "mongodb://127.0.0.1:27017/dyon";
  await database();
})();

// Give the first 3 users 5 of their respective indexed asset, then give each user 1 of each asset
async function GiveUsersAssets() {
  const assets = await Asset.find({});
  const users = await User.find({});

  for await (const user of users) {
    for await (const asset of assets) {
      await user.addAsset(asset.productIdentifier, 3);
    }
    await user.save();
  }
}
function getRand(min: number, max: number): number {
  const num = Math.random() * (max - min) + min;
  return +num.toFixed(2);
}

function getTimes() {
  const y = new Date();
  y.setDate(new Date().getDate() - 1);
  const start = config.startDate;

  const times = [];
  for (let d = start; d <= y; d.setDate(d.getDate() + 1)) {
    times.push(new Date(d));
  }
  return times;
}

async function main() {
  await AddUsers();
  await AddAssetProd();
  await GiveUsersAssets();
}

(async () => {
  await main();
  console.log("fin");
})();
