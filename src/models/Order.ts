import { modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export type OrderSide = "BID" | "ASK";
export type OrderStatus = "PENDING" | "COMPLETE" | "CANCELED";

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export default abstract class Order extends TimeStamps {
  @prop({ required: true })
  userId!: string;

  @prop({ required: true })
  productIdentifier!: string;

  @prop({ required: true })
  side!: OrderSide;

  @prop({ required: true })
  quantity!: number;

  @prop({ required: true })
  orderId!: string;

  @prop({ required: true })
  status!: OrderStatus;

  @prop({ required: true })
  filled!: number;

  matched!: string[];
}
