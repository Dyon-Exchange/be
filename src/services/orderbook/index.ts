import AddAsset from "./AddAsset";
import CalculateMarketPrice from "./CalculateMarketPrice";
import AddLimitOrder from "./AddLimitOrder";
import AddMarketOrder from "./AddMarketOrder";
import CancelOrder from "./CancelOrder";
import UpdateMarketPrices from "./UpdateMarketPrices";
import { httpClient } from "./common";

export default {
  AddAsset,
  CalculateMarketPrice,
  AddLimitOrder,
  AddMarketOrder,
  CancelOrder,
  UpdateMarketPrices,
  HealthCheck: async (): Promise<void> => {
    const { data } = await httpClient.get("/healthCheck");
    if (!data.alive) {
      throw Error("Orderbook server is not live");
    }
  },
};
