import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class PriceEvent extends TimeStamps {
  @prop({ required: true })
  productIdentifier!: string;

  @prop({ required: true })
  price!: number;
}

export default getModelForClass(PriceEvent);
