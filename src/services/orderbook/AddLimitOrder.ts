import LimitOrder, {
  LimitOrder as LimitOrderClass,
} from "../../models/LimitOrder";
import { User as UserClass } from "../../models/User";
import { v4 as uuidv4 } from "uuid";
import { OrderSide } from "../../models/Order";
import { DocumentType } from "@typegoose/typegoose";
import {
  OrderBookOrder,
  AddLimitOrderResponse,
  httpClient,
  processPartialOrder,
  processDoneOrder,
} from "./common";

/**
 * Extract the user's order from the returned orders from the orderbook
 * @param arr orders returned from the orderbook
 * @param orderId user's order id so
 * @returns array and user's order
 */
function extract(
  arr: OrderBookOrder[],
  orderId: string
): { filledOrders: OrderBookOrder[]; myOrder?: OrderBookOrder } {
  let myOrder;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === orderId) {
      myOrder = arr[i];
      arr.splice(i, 1);
    }
  }
  return { filledOrders: arr, myOrder };
}

/**
 * Add a limit order to the orderbook and process the results returned from the orderbook
 * @param productIdentifier for asset to add the limit order for
 * @param side of the order being added
 * @param quantity of the order being added
 * @param price of the order being added
 * @param user that the user is being added for
 * @returns Mongo document for new order created
 */
export default async function AddLimitOrder(
  productIdentifier: string,
  side: OrderSide,
  quantity: number,
  price: number,
  user: DocumentType<UserClass>
): Promise<DocumentType<LimitOrderClass>> {
  if (await user.hasPendingOrderOnOtherSide(productIdentifier, side)) {
    throw new Error(
      "You already have a pending order on the other side of this asset. Cancel that order before making a new one."
    );
  }

  // Check that the user has enough credit in their account to make this order if making a BID order
  if (!user.hasEnoughBalance(quantity, price) && side == "BID") {
    throw new Error(
      `User does not have enough cash to make this order ${
        price * quantity
      } > ${user.cashBalance}`
    );
  }

  // Check that the user has enough of an asset in their account to make this order if making an ASK order
  if (user.getAssetQuantity(productIdentifier) < quantity && side == "ASK") {
    throw new Error("User does not have enough asset to sell that quantity");
  }

  // Create the new order
  const newOrder = await LimitOrder.create({
    userId: user._id,
    price,
    productIdentifier,
    side,
    quantity,
    orderId: uuidv4(),
    status: "PENDING",
    filled: 0,
    matched: [],
    filledPriceTotal: 0,
    filledPriceAverage: 0,
    weightedPriceAverages: [],
  });
  await newOrder.save();

  // Send the order to the order book
  const response = await httpClient.post("/addLimitOrder", {
    OrderID: newOrder.orderId,
    Side: newOrder.side,
    UserID: newOrder.userId,
    Quantity: newOrder.quantity,
    Asset: newOrder.productIdentifier,
    Price: newOrder.price,
  });

  // Process the response from the orderbook
  const data: AddLimitOrderResponse = response.data;

  let priceTotal = 0; // how much the user that initiated the order has spent. ASK/BID limit orders may have filled at prices above or below their limit
  const weightedPriceAverages: number[] = [];
  let userOrder; // find the user's order from the returned done and partial orders from the orderbook

  // Process the completed orders from the order book
  if (data.Done) {
    const { filledOrders, myOrder } = extract(data.Done, newOrder.orderId);
    userOrder = myOrder;

    if (userOrder) {
      await processDoneOrder(userOrder, false);
    }

    // Add the amount spent/received by the user on filling all the done orders
    for await (const o of filledOrders) {
      if (newOrder.orderId !== o.id) {
        priceTotal += o.price * o.quantity;
        await processDoneOrder(o, true, weightedPriceAverages);
      }
    }
  }

  // Process the partial complete orders
  if (data.Partial) {
    const partialQuantity = Number(data.PartialQuantityProcessed);
    if (data.Partial.id === newOrder.orderId) {
      if (userOrder) {
        throw new Error(
          `User order ${newOrder.orderId} was included in both done and partial`
        );
      }
      userOrder = data.Partial;
      await processPartialOrder(data.Partial, partialQuantity, false);
    } else {
      priceTotal += data.Partial.price * partialQuantity; // add the amount spent/received by the user on filling the partial order
      await processPartialOrder(data.Partial, partialQuantity, true);
    }
  }

  // If the user order was included in the responses update their cash balance
  if (userOrder) {
    await user.updateCashBalanceFromOrder(priceTotal, userOrder.side);
  }
  const order = await LimitOrder.findById(newOrder._id);
  if (!order) {
    throw new Error(`Refetching ${newOrder._id} failed`);
  }
  order.filledPriceTotal = priceTotal;
  await order.save();
  return order;
}
