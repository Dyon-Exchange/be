import { OrderSide } from "../../models/Order";
import { httpClient } from "./common";

export default async function CalculateMarketPrice(
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
    console.log(response.data);
    return response.data.Price;
  } catch (e) {
    console.log(e.response.text);
    return undefined;
  }
}
