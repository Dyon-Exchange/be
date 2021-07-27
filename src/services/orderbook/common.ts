import axios from "axios";
import { DocumentType } from "@typegoose/typegoose";
import User, { User as UserClass } from "../../models/User";
import LimitOrder, {
  LimitOrder as LimitOrderClass,
} from "../../models/LimitOrder";
import config from "../../config";

// Axios instance for interacting with the orderbook server
export const httpClient = axios.create({
  baseURL: config.orderbookUrl,
});

// Represents an order in the orderbook
export type OrderBookOrder = {
  side: "buy" | "sell";
  id: string;
  timestamp: Date;
  quantity: number;
  price: number;
};

// Represents the response returned after adding a limit order to the orderbook
export type AddLimitOrderResponse = {
  Done: OrderBookOrder[] | null;
  Partial: OrderBookOrder | null;
  PartialQuantityProcessed: number;
};

// Represents the response returned after adding a market order to the orderbook
export type AddMarketOrderResponse = {
  Done: OrderBookOrder[];
  Partial: OrderBookOrder;
  PartialQuantityProcessed: number;
  QuantityLeft: number;
};

// Process a partial order returned from the orderbook
export async function processPartialOrder(
  o: OrderBookOrder,
  filled: number,
  updateCashBalance: boolean
): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.filled = order.filled + filled;
  await order.save();
  await user.updateAssetQuantityFromOrder(order, filled);
  if (updateCashBalance) {
    await user.updateCashBalanceFromOrder(filled * order.price, o.side);
  }
}

// Process a done order returned from the orderbook
export async function processDoneOrder(
  o: OrderBookOrder,
  updateCashBalance: boolean
): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.status = "COMPLETE";
  const filled = order.filled;
  order.filled = order.quantity;
  await order.save();
  await user.updateAssetQuantityFromOrder(order, order.quantity - filled);
  if (updateCashBalance) {
    await user.updateCashBalanceFromOrder(
      (order.quantity - filled) * order.price,
      o.side
    );
  }
}

// Get user and order model from mongo from and OrderBookOrder
export async function getOrderAndUserModel(o: OrderBookOrder): Promise<{
  order: DocumentType<LimitOrderClass>;
  user: DocumentType<UserClass>;
}> {
  const order = await LimitOrder.findOne({ orderId: o.id });
  if (!order)
    throw new Error(`No LimitOrder with that orderId:${o.id}  exists`);
  const user = await User.findOne({ _id: order.userId });
  if (!user) throw new Error("No user with that id");
  return {
    order,
    user,
  };
}
