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
    price: Number(price),
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

  if (data.QuantityLeft < newOrder.quantity) {
    const filled = newOrder.quantity - data.QuantityLeft;
    await user.updateAssetQuantityFromOrder(newOrder, filled);
    user.updateCashBalanceFromOrder(
      priceTotal,
      newOrder.side === "ASK" ? "sell" : "buy"
    );
    newOrder.filled = filled;
    newOrder.status = "COMPLETE";
    await newOrder.save();
  } else {
    newOrder.status = "CANNOT-FILL";
    await newOrder.save();
  }
  return newOrder;
}
