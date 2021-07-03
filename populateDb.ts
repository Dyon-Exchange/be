import User from "./src/models/User";
import Asset from "./src/models/Asset";
import Token from "./src/models/Token";
import config from "./src/config";
import orderbook from "./src/services/orderbook";
import database from "./src/services/database";
import LimitOrder from "./src/models/LimitOrder";

async function AddUsers() {
  const password = "password";
  await User.create({
    email: "conor@labrys.io",
    password,
    cashBalance: 2500,
    firstName: "Conor",
    lastName: "Brosnan",
    assets: [],
  });

  await User.create({
    email: "matilda@labrys.io",
    password,
    cashBalance: 2500,
    firstName: "Matilda",
    lastName: "K",
    assets: [],
  });

  await User.create({
    email: "jeremy@dyon.com",
    password,
    cashBalance: 2500,
    firstName: "Jeremy",
    lastName: "Howard",
    assets: [],
  });

  await User.create({
    email: "alice@dyon.com",
    password,
    cashBalance: 2500,
    firstName: "Alice",
    lastName: "Smith",
    assets: [],
  });

  await User.create({
    email: "bob@dyon.com",
    password,
    cashBalance: 2500,
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
    image: "",
    blurb:
      "Château Latour is one of Bordeaux's – and the world's – most famous wine producers. It is situated in the southeast corner of the Pauillac commune on the border of Saint-Julien, in the Médoc region. Rated as a First Growth in the 1855 Bordeaux Classification, it has become one of the most sought-after and expensive wine producers on the planet, and produces powerfully structured Cabernet Sauvignon-dominant wines capable of lasting many decades.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "101187220001200750",
    year: "2000",
    caseId: "00000001",
    locationId: "000",
    taxCode: "030",
    conditionCode: "010",
    name: "Lafite",
    image: "",
    blurb:
      "Château Lafite Rothschild is a wine estate in France, owned by members of the Rothschild family since the 19th century. The name Lafite comes from the surname of the La Fite family. Lafite was one of four wine-producing châteaux of Bordeaux originally awarded First Growth status in the 1855 Classification, which was based on the prices and wine quality at that time. Since then, it has been a consistent producer of one of the world's most expensive red wines.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "102867419650100750",
    name: "Domaine de la Romanee-Conti Richebourg Grand Cru",
    year: "1965",
    caseId: "00000001",
    locationId: "000",
    taxCode: "030",
    conditionCode: "010",
    image: "",
    blurb:
      "Domaine de la Romanée-Conti, often abbreviated to DRC, is an estate in Burgundy, France that produces white and red wine. It is widely considered among the world's greatest wine producers, and DRC bottles are among the world's most expensive. It takes its name from the domaine's most famous vineyard, Romanée-Conti.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "100428520130600750",
    name: "Penfolds Grange",
    year: "2013",
    caseId: "00000006",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    image: "",
    blurb:
      "Penfolds Grange (until the 1989 vintage labelled Penfolds Grange Hermitage) is an Australian wine, made predominantly from the Shiraz (Syrah) grape and usually a small percentage of Cabernet Sauvignon. It is widely considered one of Australia's 'first growth' and its most collectable wine.[1] The term 'Hermitage', the name of a French wine appellation, was commonly used in Australia as another synonym for Shiraz or Syrah. Penfolds is owned by Treasury Wine Estates.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "108254220080600750",
    name: "Louis Roederer Cristal",
    year: "2008",
    caseId: "00000365",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    image: "",
    blurb:
      "Cristal is the flagship cuvée of Champagne Louis Roederer, created in 1876 for Alexander II, tsar of Russia.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "104380020160300750",
    name: "Domaine Leroy Chambertin Grand Cru",
    year: "2016",
    locationId: "001",
    taxCode: "001",
    image: "",
    caseId: "00000009",
    conditionCode: "001",
    blurb:
      "Domaine Leroy is a vineyard estate which produces red Burgundy. The domaine has always produced biodynamic wine, and is certified by ECOCERT.[1] Lalou Bize-Leroy of Domaine Leroy also owns a quarter of Domaine de la Romanée-Conti. The domaine has 23 hectares of vines, mostly Premier Cru and Grand Cru classified.",
    supply: 10,
  });
}

async function AddAssetTest() {
  await CreateAssetAndToken({
    productCode: "101231620010600750",
    year: "2020",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Jim Beam",
    image:
      "https://storage.googleapis.com/dyon/product-images/101231620010600710.png",
    blurb:
      "Jim Beam is an American brand of bourbon whiskey produced in Clermont, Kentucky, by Beam Suntory. It is one of the best-selling brands of bourbon in the world. Since 1795 (interrupted by Prohibition), seven generations of the Beam family have been involved in whiskey production for the company that produces the brand. The brand name became 'Jim Beam' in 1943 in honor of James B. Beam, who rebuilt the business after Prohibition ended. Previously produced by the Beam family and later owned by the Fortune Brands holding company, the brand was purchased by Suntory Holdings in 2014.",
    supply: 10,
  });

  await CreateAssetAndToken({
    productCode: "101211620010600710",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Kraken",
    year: "2020",
    supply: 10,
    blurb:
      "Kraken Black Spiced Rum is a Caribbean black spiced rum. It is distributed in the United States by Proximo Spirits, and named after the kraken, a mythical giant squid-like sea monster. However, the bottle has a rendering of the actual giant squid with a reference to its scientific name, Architeuthis Dux.",
    image:
      "https://storage.googleapis.com/dyon/product-images/101211620010600710.png",
  });

  await CreateAssetAndToken({
    productCode: "101231620010690710",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Bundaberg",
    year: "2020",
    supply: 10,
    blurb:
      "Bundaberg Rum is a dark rum produced in Bundaberg, Queensland, Australia, by the Bundaberg Distilling Company. It is often referred to as 'Bundy'. In 2010, the Bundaberg Distilling Company was inducted into the Queensland Business Leaders Hall of Fame.",
    image:
      "https://storage.googleapis.com/dyon/product-images/101231620010690710.png",
  });

  await CreateAssetAndToken({
    productCode: "101242520010600750",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Wild Turkey",
    year: "2020",
    supply: 10,
    image:
      "https://storage.googleapis.com/dyon/product-images/101242520010600750.png",
    blurb:
      "Wild Turkey is a brand of Kentucky straight bourbon whiskey distilled and bottled by the Wild Turkey Distilling Co, a division of Campari Group. The distillery is located near Lawrenceburg, Kentucky. It offers tours and is part of the American Whiskey Trail and the Kentucky Bourbon Trail.",
  });

  await CreateAssetAndToken({
    productCode: "101231620010617710",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Sailor Jerry",
    year: "2020",
    supply: 10,
    image:
      "https://storage.googleapis.com/dyon/product-images/101231620010617710.png",
    blurb:
      "Sailor Jerry Ltd. produces a 92 proof spiced Navy rum featuring a quintessential Sailor Jerry hula girl on the label. As the bottle is emptied, additional pin-up girls designed by Sailor Jerry are visible on the inner side of the label. The rum is distilled in the U.S. Virgin Islands. It takes its influence from Caribbean rum, which sailors would spice with flavors from the Far East and Asia. In 2010, the 40% ABV formula being sold in the United Kingdom was changed to include a less sweet taste in a move that was described as more 'vanilla and caramel flavours'.",
  });

  await CreateAssetAndToken({
    productCode: "101242527210600750",
    year: "2020",
    caseId: "00000003",
    locationId: "001",
    taxCode: "001",
    conditionCode: "001",
    name: "Jameson",
    supply: 10,
    image:
      "https://storage.googleapis.com/dyon/product-images/101242527210600750.png",
    blurb:
      "Jameson is a blended Irish whiskey produced by the Irish Distillers subsidiary of Pernod Ricard. Originally one of the six main Dublin Whiskeys at the Jameson Distillery Bow St., Jameson is now distilled at the New Midleton Distillery in County Cork. It is by far the best-selling Irish whiskey in the world; in 2019, annual sales passed 8 million cases. It has been sold internationally since the early 19th century, and is available to buy in over 130 countries.",
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

  for (let i = 0; i < 3; i++) {
    const user = users[i];
    await user.addAsset(assets[i].productIdentifier, 5);
    await user.save();
  }

  for await (const user of users) {
    for await (const asset of assets) {
      await user.addAsset(asset.productIdentifier, 1);
    }
    await user.save();
  }
}
function getRand(min: number, max: number): number {
  const num = Math.random() * (max - min) + min;
  return +num.toFixed(2);
}
// Each user will submit a bid order for 3 of each asset at different prices (between 5-30$) so that users are able to test selling and market prices will be filled
async function AddBidOrders(): Promise<void> {
  const users = await User.find({});

  for await (const user of users) {
    for await (const asset of user.assets) {
      await orderbook.AddLimitOrder(
        asset.productIdentifier,
        "BID",
        3,
        getRand(10, 20),
        user
      );
    }
  }
}

// Each user will submit an ask order for 1 of each asset a different price beteween 20-30, this is to ensure that none of the BID orders get filled.
async function AddAskOrders(): Promise<void> {
  const users = await User.find({});

  for await (const user of users) {
    for await (const asset of user.assets) {
      await orderbook.AddLimitOrder(
        asset.productIdentifier,
        "ASK",
        1,
        getRand(20, 30),
        user
      );
    }
  }
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

async function AddPriceHistoryData(): Promise<void> {
  const assets = await Asset.find({});

  for await (const asset of assets) {
    const times = getTimes();
    for await (const time of times) {
      await asset.addPriceEvent(getRand(10, 30), time);
    }
  }
}

async function AddCurrentPriceHistoryData(): Promise<void> {
  const assets = await Asset.find({});
  const now = new Date();

  for await (const asset of assets) {
    const marketPrice = await orderbook.CalculateMarketPrice(
      asset.productIdentifier,
      1,
      "ASK"
    );

    await asset.addPriceEvent(marketPrice as number, now);
  }
}

// Add some bid orders to the orderbook so market price for each asset can be calculated
//async function AddBidOrders() {}

async function main() {
  await AddUsers();
  if (process.argv[2] === "prod") {
    await AddAssetProd();
  } else {
    await AddAssetTest();
  }
  await GiveUsersAssets();
  await AddBidOrders();
  await AddAskOrders();
  await AddPriceHistoryData();
  await AddCurrentPriceHistoryData();
}

(async () => {
  await main();
  console.log("fin");
})();
