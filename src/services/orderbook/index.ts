import AddAsset from "./AddAsset";
import CalculateMarketPrice from "./CalculateMarketPrice";
import AddLimitOrder from "./AddLimitOrder";
import AddMarketOrder from "./AddMarketOrder";
import CancelOrder from "./CancelOrder";
import UpdateMarketPrices from "./UpdateMarketPrices";
import { httpClient, OrderBookOrder } from "./common";

type GetOrdersResponse = {
  buy: OrderBookOrder[];
  sell: OrderBookOrder[];
};

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
  GetOrders: async (productIdentifier: string): Promise<GetOrdersResponse> => {
    const { data } = await httpClient.get("/getOrders");
    const { Assets } = data;
    if (!Assets[productIdentifier]) {
      return {
        buy: [],
        sell: [],
      };
    }

    let buy: OrderBookOrder[] = [];
    Object.keys(Assets[productIdentifier].bids.prices).forEach((price) => {
      buy = buy.concat(Assets[productIdentifier].bids.prices[price].orders);
    });

    let sell: OrderBookOrder[] = [];
    Object.keys(Assets[productIdentifier].asks.prices).forEach((price) => {
      sell = sell.concat(Assets[productIdentifier].asks.prices[price].orders);
    });

    return { sell, buy };
  },
};
