import MarketOrder, {
  MarketOrder as MarketOrderClass,
} from "../../models/MarketOrder";
import { DocumentType } from "@typegoose/typegoose";
import { OrderSide } from "../../models/Order";
import { User as UserClass } from "../../models/User";
import { v4 as uuidv4 } from "uuid";
import {
  AddMarketOrderResponse,
  httpClient,
  processDoneOrder,
  processPartialOrder,
} from "./common";
import CalculateMarketPrice from "./CalculateMarketPrice";

/**
 * Add a market order to the order book and process the results
 * @param productIdentifier asset to place the market order for
 * @param side to add the order on
 * @param quantity of the order
 * @param user user to add the order on behalf of
 * @returns the new market order mongo document
 */
export default async function AddMarketOrder(
  productIdentifier: string,
  side: OrderSide,
  quantity: number,
  user: DocumentType<UserClass>
): Promise<DocumentType<MarketOrderClass>> {
  if (await user.hasPendingOrderOnOtherSide(productIdentifier, side)) {
    throw new Error(
      "You already have a pending order on the other side of this asset. Please cancel that order before making a new one."
    );
  }

  const price = await CalculateMarketPrice(productIdentifier, quantity, side);

  const newOrder = await MarketOrder.create({
    userId: user._id,
    productIdentifier,
    side,
    quantity,
    orderId: uuidv4(),
    status: "PENDING",
    filled: 0,
    matched: [],
    price: price ? Number(price) : 0,
    filledPriceTotal: 0,
    filledPriceAverage: 0,
    weightedPriceAverages: [],
  });

  await newOrder.save();

  const response = await httpClient.post("/addMarketOrder", {
    OrderID: newOrder.orderId,
    UserID: newOrder.userId,
    Side: newOrder.side,
    Quantity: newOrder.quantity,
    Asset: newOrder.productIdentifier,
  });
  const data: AddMarketOrderResponse = response.data;

  console.log({ data });

  let priceTotal = 0; // how much the user that initiated the order has spent.

  if (data.Done) {
    for await (const o of data.Done) {
      priceTotal += o.price * o.quantity;
      await processDoneOrder(o, true);
    }
  }

  if (data.Partial) {
    const partialQuantity = Number(data.PartialQuantityProcessed);
    priceTotal += data.Partial.price * partialQuantity;
    await processPartialOrder(data.Partial, partialQuantity, true);
  }

  newOrder.filledPriceTotal = priceTotal;

  if (data.QuantityLeft < newOrder.quantity) {
    const filled = newOrder.quantity - data.QuantityLeft;
    await user.updateAssetQuantityFromOrder(newOrder, filled);
    user.updateCashBalanceFromOrder(
      priceTotal,
      newOrder.side === "ASK" ? "sell" : "buy"
    );
    newOrder.filled = filled;
    newOrder.status = "COMPLETE";
  } else {
    newOrder.status = "CANNOT-FILL";
  }
  await newOrder.save();
  return newOrder;
}
