import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class AssetPriceEvent extends TimeStamps {
  @prop({ required: true })
  productIdentifier!: string;

  @prop({ required: true })
  price!: number;

  @prop({ required: true })
  time!: Date;

  /*
   * Get the date for this price event in a human friendly string
   */
  public date(): string {
    return this.time.toLocaleDateString("en", {
      month: "numeric",
      day: "numeric",
    });
  }
}

export default getModelForClass(AssetPriceEvent);
