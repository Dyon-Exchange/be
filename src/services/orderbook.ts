import axios from "axios";
import LimitOrder, {
  LimitOrder as LimitOrderClass,
} from "../models/LimitOrder";
import MarketOrder, {
  MarketOrder as MarketOrderClass,
} from "../models/MarketOrder";
import { Asset as AssetClass } from "../models/Asset";
import User, { User as UserClass } from "../models/User";
import config from "../config";
import _ from "lodash";
import { OrderSide } from "../models/Order";

const httpClient = axios.create({
  baseURL: config.orderbookUrl,
});

export type OrderBookOrder = {
  side: "buy" | "sell";
  id: string;
  timestamp: Date;
  quantity: number;
  price: number;
};

export type AddLimitOrderResponse = {
  Done: OrderBookOrder[] | null;
  Partial: OrderBookOrder | null;
  PartialQuantityProcessed: number;
};
export type AddMarketOrderResponse = {
  Done: OrderBookOrder[];
  Partial: OrderBookOrder;
  PartialQuantityProcessed: number;
  QuantityLeft: number;
};

async function getOrderAndUserModel(o: OrderBookOrder) {
  const limitOrder = await LimitOrder.findOne({ orderId: o.id });
  const marketOrder = await MarketOrder.findOne({ orderId: o.id });

  const order = limitOrder ? limitOrder : marketOrder;
  if (!order)
    throw new Error(
      `No MarketOrder or LimitOrder with that orderId:${o.id}  exists`
    );

  const user = await User.findOne({ _id: order.userId });
  if (!user) throw new Error("No user with that id");

  return {
    order,
    user,
  };
}

async function processPartialOrder(
  o: OrderBookOrder,
  filled: number
): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.filled = order.filled + filled;
  await order.save();
  user.updateAssetQuantityFromOrder(order, filled);
}

async function processDoneOrder(o: OrderBookOrder): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.status = "COMPLETE";
  const filled = order.filled;
  order.filled = order.quantity;
  await order.save();
  await user.updateAssetQuantityFromOrder(order, order.quantity - filled);
}

export default {
  addAsset: async (productIdentifier: string): Promise<void> => {
    await httpClient.post("/addAsset", {
      Asset: productIdentifier,
    });
  },
  addLimitOrder: async (order: LimitOrderClass): Promise<void> => {
    const response = await httpClient.post("/addLimitOrder", {
      OrderID: order.orderId,
      Side: order.side,
      Quantity: order.quantity,
      Asset: order.productIdentifier,
      Price: order.price,
    });
    const data: AddLimitOrderResponse = response.data;
    data.Done && (await Promise.all(data.Done.map(processDoneOrder)));
    data.Partial &&
      (await processPartialOrder(data.Partial, data.PartialQuantityProcessed));
  },
  addMarketOrder: async (order: MarketOrderClass): Promise<void> => {
    const response = await httpClient.post("/addMarketOrder", {
      OrderID: order.orderId,
      Side: order.side,
      Quantity: order.quantity,
      Asset: order.productIdentifier,
    });
    const data: AddMarketOrderResponse = response.data;
  },
  calculateMarketPrice: async (
    productIdentifier: string,
    quantity: number,
    side: OrderSide
  ): Promise<void> => {
    const response = await httpClient.post("/calculateMarketPrice", {
      Asset: productIdentifier,
      quantity,
      side,
    });
    return response.data.Price;
  },
  cancelOrder: async (
    order: LimitOrderClass | MarketOrderClass
  ): Promise<void> => {
    const response = await httpClient.post("/cancelOrder", {
      OrderId: order.orderId,
      Asset: order.productIdentifier,
    });
    const data: OrderBookOrder = response.data.Order;
    if (data.id === order.orderId) {
      order.status = "CANCELED";
      // @ts-ignore
      await order.save();
    } else {
      throw new Error(
        `Order ${order.orderId} does not much orderbook order ${data.id}`
      );
    }
  },
};
