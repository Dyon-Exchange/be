import { OrderSide } from "../../models/Order";
import { httpClient } from "./common";

/*
 * Calculate the market price for the specified productIdentifier, quantity and order side
 */
async function CalculateMarketPrice(
  productIdentifier: string,
  quantity: number,
  side: OrderSide
): Promise<number | undefined> {
  try {
    const response = await httpClient.post("/calculateMarketPrice", {
      Asset: productIdentifier,
      quantity,
      side,
    });
    return response.data.Price;
  } catch (e) {
    return undefined;
  }
}

export default CalculateMarketPrice;
