import {
  getModelForClass,
  modelOptions,
  prop,
  index,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
@index({ productCode: 1, caseId: 1 }, { unique: true })
export class Token extends TimeStamps {
  @prop({ required: true })
  public productCode!: string;

  @prop({ required: true })
  public caseId!: string;

  @prop({ required: true })
  public locationId!: string;

  @prop({ required: true })
  public taxCode!: string;

  @prop({ required: true })
  public conditionCode!: string;

  @prop({ required: true, unique: true })
  public tokenId!: string;

  @prop({ required: true })
  productIdentifier!: string; // product id + location id + tax status + condition code
}

export default getModelForClass(Token);
