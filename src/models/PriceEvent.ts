import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class PriceEvent extends TimeStamps {
  @prop({ required: true })
  price!: number;

  @prop({ required: true })
  time!: Date;
}

export default getModelForClass(PriceEvent);
