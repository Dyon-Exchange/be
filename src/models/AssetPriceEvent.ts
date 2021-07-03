import { getModelForClass, prop } from "@typegoose/typegoose";
import { PriceEvent } from "./PriceEvent";

export class AssetPriceEvent extends PriceEvent {
  @prop({ required: true })
  productIdentifier!: string;

  public date(): string {
    return this.time.toLocaleDateString("en", {
      month: "numeric",
      day: "numeric",
    });
  }
}

export default getModelForClass(AssetPriceEvent);
