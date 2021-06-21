import { getModelForClass } from "@typegoose/typegoose";
import Order from "./Order";

export class MarketOrder extends Order {}

export default getModelForClass(MarketOrder);
