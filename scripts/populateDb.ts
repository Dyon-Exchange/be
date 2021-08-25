import User from "../src/models/User";
import Asset from "../src/models/Asset";
import Token from "../src/models/Token";
import Config from "../src/models/Config";
import config from "../src/config";
import Contract from "../src/services/contracts";
import orderbook from "../src/services/orderbook";
import Mongoose from "mongoose";
import wines from "./data/wines.json";
import { formatPriceString } from "./helpers/formatPriceString";
import { formatCaseId } from "./helpers/formatCaseId";
import { lineBreak } from "./helpers/lineBreak";
import { findWineData } from "./helpers/findWineData";

/**
 * Run this file via the `npm run populate-db` script in package.json. It will print output to a file in the logs folder
 */

async function dropDatabase(): Promise<void> {
  await Mongoose.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await Mongoose.connection.db.dropDatabase();
}

const x = 10000000;

async function AddUsers() {
  const password = "password";
  await User.create({
    email: "joel@dyon.cc",
    password,
    cashBalance: x,
    firstName: "Joel",
    lastName: "Pearceman",
    assets: [],
  });

  await User.create({
    email: "maria@dyon.cc",
    password,
    cashBalance: x,
    firstName: "Maria",
    lastName: "Bamford",
    assets: [],
  });

  await User.create({
    email: "jeremy@dyon.cc",
    password,
    cashBalance: x,
    firstName: "Jeremy",
    lastName: "Howard",
    assets: [],
  });

  await User.create({
    email: "alice@dyon.cc",
    password,
    cashBalance: x,
    firstName: "Alice",
    lastName: "Smith",
    assets: [],
  });

  await User.create({
    email: "bob@dyon.cc",
    password,
    cashBalance: x,
    firstName: "Bob",
    lastName: "Skinner",
    assets: [],
  });

  await User.create({
    email: "JQ@dyon.cc",
    password,
    cashBalance: x,
    firstName: "James",
    lastName: "Quinn",
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
  lineBreak(false);
  // let txHash: string;
  const txHash = "my-tx-hash";
  // const contract = await Contract();
  // const response = await contract.mint(
  //   BigNumber.from(
  //     `${a.productCode}${a.caseId}${a.locationId}${a.taxCode}${a.conditionCode}`
  //   ),
  //   a.supply,
  //   {
  //     gasLimit: 12487794,
  //   }
  // );

  // await response.wait();
  // txHash = response.hash;

  try {
    const asset = await Asset.create({
      productIdentifier: a.productCode,
      year: a.year,
      name: a.name,
      details: {
        blurb: a.blurb,
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
      image: a.image,
      changeAmount: "",
      changePercentage: "",
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

    console.log("asset sucessfully added");
    console.log("asset is:");
    console.log({ txHash, name: a.name, productIdentifier: a.productCode });
  } catch (err) {
    console.log("failed create asset with productIdentifier: ", a.productCode);
    console.log("error message: ", err.message);
  }

  lineBreak(true);
}

async function AddAssetProd() {
  let caseId = 1;
  for await (const wine of wines) {
    console.log("adding wine");
    console.log(wine);
    await CreateAssetAndToken({
      productCode: wine["LWIN"],
      year: wine["Vintage"].toString(),
      caseId: formatCaseId(caseId),
      locationId: "000",
      taxCode: "030",
      conditionCode: "029",
      name: wine["Wine Name"],
      image: "",
      blurb: `"${wine["Wine Name"]} is one of the world's most famous wine producers. It is situated in the southeast corner of an idyllic settlement on the border of two countries, in a resplendent field. Rated as a First Growth in the numerous classifications, it has become one of the most sought-after and expensive wine producers on the planet, and produces powerfully structured wines capable of lasting many decades.`,
      supply: 15,
    });

    caseId++;
  }
}

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
// Each user will submit a bid order for 3 of each asset at different prices (between 5-30$) so that users are able to test selling and market prices will be filled
async function AddBidOrders(): Promise<void> {
  console.log("adding bid orders");
  const users = await User.find({});

  for await (const user of users.slice(0, 4)) {
    for await (const asset of user.assets) {
      const wine = findWineData(asset.productIdentifier);
      const price = formatPriceString(wine["Market Price (US$)"]);
      await orderbook.AddLimitOrder(
        asset.productIdentifier,
        "BID",
        3,
        price,
        user
      );
    }
  }
}

// Each user will submit an ask order for 1 of each asset a different price beteween 20-30, this is to ensure that none of the BID orders get filled.
async function AddAskOrders(): Promise<void> {
  console.log("adding ask orders");
  const users = await User.find({});

  for await (const user of users.slice(4, users.length)) {
    for await (const asset of user.assets) {
      const wine = findWineData(asset.productIdentifier);
      const price = formatPriceString(wine["Market Price (US$)"]);
      const askPrice = Number((price + price * 0.1).toFixed(2));
      await orderbook.AddLimitOrder(
        asset.productIdentifier,
        "ASK",
        1,
        askPrice,
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
  console.log("adding price history data");
  const times = getTimes();
  for await (const wine of wines) {
    const [asset] = await Asset.find({ productIdentifier: wine["LWIN"] });
    const price = formatPriceString(wine["Market Price (US$)"]);
    const priceBuffer = Number((price * 0.1).toFixed(2));
    for await (const time of times) {
      await asset.addPriceEvent(
        getRand(price - priceBuffer, price + priceBuffer),
        time
      );
    }
  }
}

async function AddCurrentPriceHistoryData(): Promise<void> {
  console.log("adding current price history data");
  const assets = await Asset.find({});
  const now = new Date();

  for await (const asset of assets) {
    const marketPrice = await orderbook.CalculateMarketPrice(
      asset.productIdentifier,
      1,
      "ASK"
    );
    lineBreak(false);
    console.log("market price for asset:", asset.productIdentifier);
    console.log(marketPrice);
    lineBreak(true);
    await asset.addPriceEvent(marketPrice as number, now);
  }
}

async function setContractAddressInDatabase() {
  console.log("setting contract address in database");
  const addr = process.argv[2];
  const config = await Config.create({
    contractAddress: addr,
  });
  config.contractAddress = addr;
  await config.save();
}

async function main() {
  try {
    await dropDatabase();
  } catch (err) {
    console.log(err.message);
  }

  await orderbook.Reset();

  await setContractAddressInDatabase();
  await AddUsers();
  if (process.argv[2] === "prod") {
    await AddAssetProd();
  } else {
    // await AddAssetTest();
  }
  await GiveUsersAssets();
  await AddBidOrders();
  await AddAskOrders();
  await AddPriceHistoryData();
  await AddCurrentPriceHistoryData();
}

// const addPriceEventsNew = async () => {
//   console.log("adding price history data");
//   const times = getTimes();
//   for await (const wine of wines) {
//     try {
//       const asset = (await Asset.find({ productIdentifier: wine["LWIN"] }))[0];
//       const price = formatPriceString(wine["Market Price (US$)"]);
//       const priceBuffer = Number((price * 0.1).toFixed(2));
//       for await (const time of times) {
//         await asset.addPriceEvent(
//           getRand(price - priceBuffer, price + priceBuffer),
//           time
//         );
//       }
//       // Set the desired price for right now
//       await asset.addPriceEvent(price, new Date());

//       console.log("price successfully added for ");
//     } catch (err) {
//       console.log("could not add prices for the following asset:");
//       console.log(wine);
//     }
//   }
// };

(async () => {
  await main();
  console.log("fin");
  return;
})();
