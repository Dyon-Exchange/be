import Asset from "../../models/Asset";
import CalculateMarketPrice from "./CalculateMarketPrice";

/**
 * Update market prices for all assets
 */
export default async function UpdateMarketPrices(): Promise<void> {
  const assets = await Asset.find();

  await Promise.all(
    assets.map(async (asset) => {
      const askMarketPrice = await CalculateMarketPrice(
        asset.productIdentifier,
        1,
        "ASK"
      );

      if (askMarketPrice) {
        asset.askMarketPrice = +Number(askMarketPrice).toFixed(2);
      } else {
        asset.askMarketPrice = undefined;
      }

      const bidMarketPrice = await CalculateMarketPrice(
        asset.productIdentifier,
        1,
        "BID"
      );

      if (bidMarketPrice) {
        asset.bidMarketPrice = +Number(bidMarketPrice).toFixed(2);
      } else {
        asset.bidMarketPrice = undefined;
      }

      await asset.save();
    })
  );
}
