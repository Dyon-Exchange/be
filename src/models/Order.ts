import { modelOptions, prop, pre } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export type OrderSide = "BID" | "ASK";
export type OrderStatus = "PENDING" | "COMPLETE" | "CANCELED" | "CANNOT-FILL";

@pre<Order>("save", function () {
  if (this.isModified("weightedPriceAverages")) {
    this.filledPriceAverage =
      this.weightedPriceAverages.reduce((p, c) => p + c, 0) /
      this.weightedPriceAverages.length;
  }
})
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

  @prop({ required: true })
  price!: number;

  @prop({ required: true })
  filledPriceTotal!: number;

  @prop({ required: true })
  filledPriceAverage!: number;

  @prop({ required: true })
  weightedPriceAverages!: number[];

  matched!: string[];
}
