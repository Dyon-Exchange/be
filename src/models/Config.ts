import { prop, modelOptions, getModelForClass } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Config {
  @prop({ required: true })
  contractAddress!: string;
}

export default getModelForClass(Config);
