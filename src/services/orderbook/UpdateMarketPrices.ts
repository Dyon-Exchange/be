import Asset from "../../models/Asset";
import CalculateMarketPrice from "./CalculateMarketPrice";

export default async function UpdateMarketPrices(): Promise<void> {
  const assets = await Asset.find();
  console.log("running");
  await Promise.all(
    assets.map(async (asset) => {
      const marketPrice = await CalculateMarketPrice(
        asset.productIdentifier,
        1,
        "ASK"
      );
      console.log({ marketPrice });

      asset.marketPrice = marketPrice;
      await asset.save();
    })
  );
}
