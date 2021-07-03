import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import config from "../config";
import uploadFile from "../services/storage";
import AssetPriceEvent from "./AssetPriceEvent";

@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Asset extends TimeStamps {
  @prop({ required: true, unique: true })
  productIdentifier!: string;

  @prop({ required: true })
  year!: string;

  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  askMarketPrice?: number;

  @prop()
  bidMarketPrice?: number;

  public async uploadImage(formData: any): Promise<void> {
    const bucketPath = `product-images/${this.productIdentifier}.png`;
    await uploadFile(formData, bucketPath);
    this.image = `https://storage.googleapis.com/${config.storageBucket}/product-images/${this.productIdentifier}.png`;
  }

  public async addPriceEvent(
    price: number,
    time: Date = new Date()
  ): Promise<void> {
    await AssetPriceEvent.create({
      productIdentifier: this.productIdentifier,
      time,
      price,
    });
  }

  @prop({ required: true })
  unitSize!: string;

  @prop()
  details?: {
    blurb: string;
  };
}

export default getModelForClass(Asset);
