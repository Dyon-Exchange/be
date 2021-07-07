import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import config from "../config";
import uploadFile from "../services/storage";
import AssetPriceEvent from "./AssetPriceEvent";
import LimitOrder from "./LimitOrder";
import Token from "./Token";
import MarketOrder from "./MarketOrder";

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

  public async getTradingVolume(): Promise<number> {
    const limitOrders = await LimitOrder.find({
      productIdentifier: this.productIdentifier,
      side: "BID",
      updatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const marketOrders = await MarketOrder.find({
      productIdentifier: this.productIdentifier,
      side: "BID",
      updatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    let volume = 0;

    for (const order of [...limitOrders, ...marketOrders]) {
      volume += order.filled;
    }

    return volume;
  }

  public async getMarketCap(): Promise<number | undefined> {
    const token = await Token.findOne({ productCode: this.productIdentifier });
    if (!token) {
      throw new Error("Asset does not have corresponding token model");
    }
    if (!this.bidMarketPrice) {
      return undefined;
    }
    return token.supply * this.bidMarketPrice;
  }

  @prop({ required: true })
  unitSize!: string;

  @prop()
  details?: {
    blurb: string;
  };
}

export default getModelForClass(Asset);
