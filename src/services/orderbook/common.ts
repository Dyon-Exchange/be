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

/**
 * Process a partial order returned from the orderbook
 * @param o partially completed order to process
 * @param filled amount of the partially completed order that filled
 * @param updateCashBalance whether to update the user's cashBalance or not
 * @param weightedAverages array to add this orders weighted price to
 */
export async function processPartialOrder(
  o: OrderBookOrder,
  filled: number,
  updateCashBalance: boolean,
  weightedAverages?: number[]
): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.filled = order.filled + filled;
  order.filledPriceTotal = order.filledPriceTotal + filled * order.price;

  // Add weighted fill price to the matched order's weightedAverages array
  if (weightedAverages) {
    weightedAverages.push(Math.ceil(filled) * order.price);
    order.weightedPriceAverages = order.weightedPriceAverages.concat(
      Math.ceil(filled) * order.price
    );
  }

  await order.save();
  await user.updateAssetQuantityFromOrder(order, filled);
  if (updateCashBalance) {
    await user.updateCashBalanceFromOrder(filled * order.price, o.side);
  }
}

/**
 * Process a done order returned from the orderbook
 * @param o completed order to process
 * @param updateCashBalance whether to update the user's cashBalance or not
 * @param weightedAverages array to add this orders weighted price to
 */
export async function processDoneOrder(
  o: OrderBookOrder,
  updateCashBalance: boolean,
  weightedAverages?: number[]
): Promise<void> {
  const { order, user } = await getOrderAndUserModel(o);
  order.status = "COMPLETE";
  const filled = order.filled;
  order.filled = order.quantity;
  order.filledPriceTotal =
    order.filledPriceTotal + (order.quantity - filled) * order.price;

  // If we get weight averages array this must not be the user's order, so we have to update this order's weighted averages and add it to the array for calculating the user's weighted averages also
  if (weightedAverages) {
    weightedAverages.push(Math.ceil(order.quantity - filled) * order.price);
    order.weightedPriceAverages = order.weightedPriceAverages.concat(
      Math.ceil(order.quantity - filled) * order.price
    );
  }

  await order.save();
  await user.updateAssetQuantityFromOrder(order, order.quantity - filled);
  if (updateCashBalance) {
    await user.updateCashBalanceFromOrder(
      (order.quantity - filled) * order.price,
      o.side
    );
  }
}

/**
 * Get user and order model from mongo from and OrderBookOrder
 * @param o order to get the mongo document and user for
 * @returns order and user mongo documents
 */
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
