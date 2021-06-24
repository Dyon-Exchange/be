import { getModelForClass, prop } from "@typegoose/typegoose";
import Order from "./Order";

export class MarketOrder extends Order {
  @prop({ required: true })
  price!: number;
}

export default getModelForClass(MarketOrder);
