import { LimitOrder as LimitOrderClass } from "../../models/LimitOrder";
import { MarketOrder as MarketOrderClass } from "../../models/MarketOrder";
import { httpClient, OrderBookOrder } from "./common";

/*
 * Cancel an order
 */
export default async function CancelOrder(
  order: LimitOrderClass | MarketOrderClass
): Promise<void> {
  const response = await httpClient.post("/cancelOrder", {
    OrderId: order.orderId,
    Asset: order.productIdentifier,
  });
  const data: OrderBookOrder = response.data.Order;
  if (data.id === order.orderId) {
    order.status = "CANCELED";
    // eslint-disable-next-line
    // @ts-ignore
    await order.save();
  } else {
    throw new Error(
      `Order ${order.orderId} does not much orderbook order ${data.id}`
    );
  }
}
