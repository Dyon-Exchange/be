import AddAsset from "./AddAsset";
import CalculateMarketPrice from "./CalculateMarketPrice";
import AddLimitOrder from "./AddLimitOrder";
import AddMarketOrder from "./AddMarketOrder";
import CancelOrder from "./CancelOrder";
import UpdateMarketPrices from "./UpdateMarketPrices";
import { httpClient, OrderBookOrder } from "./common";

// Represents the response returned from a getOrders request to the orderbook
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
  /**
   * Perform a health check on the orderbook server
   */
  HealthCheck: async (): Promise<void> => {
    const { data } = await httpClient.get("/healthCheck");
    if (!data.alive) {
      throw Error("Orderbook server is not live");
    }
  },

  /**
   * Get all the orders from the orderbook for the specified asset
   * @param productIdentifier assets to get the orders for
   * @returns buy and sell arrays of the orders
   */
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

  /**
   * Reset the orderbook, clears all orders
   */
  Reset: async (): Promise<void> => {
    await httpClient.get("/reset");
  },
};
