import { getModelForClass } from "@typegoose/typegoose";
import Order from "./Order";

export class LimitOrder extends Order {}

export default getModelForClass(LimitOrder);
