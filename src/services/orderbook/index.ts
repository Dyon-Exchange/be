import AddAsset from "./AddAsset";
import CalculateMarketPrice from "./CalculateMarketPrice";
import AddLimitOrder from "./AddLimitOrder";
import AddMarketOrder from "./AddMarketOrder";
import CancelOrder from "./CancelOrder";
import UpdateMarketPrices from "./UpdateMarketPrices";
import { httpClient, OrderBookOrder } from "./common";
import { debugLog } from "../../helpers/debugLog";

// Represents the response returned from a getOrders request to the orderbook
export type GetOrdersResponse = {
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
    debugLog("good endpoint");

    let res;
    try {
      res = await httpClient.get(`/getOrders?prodId=${productIdentifier}`);
    } catch (err) {
      console.error(err.message);
      throw new Error("orderbook server error - check prodidentifier");
    }

    debugLog(res);
    debugLog(res.data);

    const Asset = res.data;

    if (!Asset) {
      return {
        buy: [],
        sell: [],
      };
    }

    let buy: OrderBookOrder[] = [];
    Object.keys(Asset.bids.prices).forEach((price) => {
      buy = buy.concat(Asset.bids.prices[price].orders);
    });

    let sell: OrderBookOrder[] = [];
    Object.keys(Asset.asks.prices).forEach((price) => {
      sell = sell.concat(Asset.asks.prices[price].orders);
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
