import {
  prop,
  modelOptions,
  getModelForClass,
  pre,
  Severity,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import isEmail from "validator/lib/isEmail";
import { hashSync } from "bcrypt";
import { MarketOrder } from "./MarketOrder";
import { LimitOrder } from "./LimitOrder";

const SALT_ROUNDS = 12;

@pre<User>("save", function (next: any) {
  if (this.isModified("password")) {
    this.password = hashSync(this.password, SALT_ROUNDS);
  }

  next();
})
@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class User extends TimeStamps {
  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;

  @prop({
    required: true,
    unique: true,
    validate: {
      validator: (v) => isEmail(v),
      message: "Value is not an email address.",
    },
  })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true })
  public cashBalance!: number;

  @prop({ required: true })
  public assets!: {
    productIdentifier: string;
    quantity: number;
  }[];

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getAssetQuantity(productIdentifier: string): number {
    const asset = this.assets.filter(
      (a: any) => a.productIdentifier === productIdentifier
    )[0];
    if (asset) {
      return asset.quantity;
    } else {
      return 0;
    }
  }

  public async updateAssetQuantityFromOrder(
    order: MarketOrder | LimitOrder,
    filled: number
  ): Promise<void> {
    const index = this.assets.findIndex(
      (a: any) => a.productIdentifier === order.productIdentifier
    );

    if (order.side === "ASK") {
      if (index === -1) {
        throw new Error(
          `${this.email} does not have any of this asset ${order.productIdentifier}. Should not have been able to submit ASK order`
        );
      } else {
        // @ts-ignore
        await this.update(
          {
            $set: {
              "assets.$[el].quantity": this.assets[index].quantity - filled,
            },
          },
          {
            arrayFilters: [{ "el.productIdentifier": order.productIdentifier }],
            new: true,
          }
        );
      }
    } else if (order.side === "BID") {
      if (index === -1) {
        this.assets.push({
          productIdentifier: order.productIdentifier,
          quantity: filled,
        });
      } else {
        // @ts-ignore
        await this.update(
          {
            $set: {
              "assets.$[el].quantity": this.assets[index].quantity + filled,
            },
          },
          {
            arrayFilters: [{ "el.productIdentifier": order.productIdentifier }],
            new: true,
          }
        );
      }
    } else {
      throw new Error("Invalid order side");
    }
    // @ts-ignore
    await this.save();
  }

  public hasEnoughBalance(quantity: number, price: number): boolean {
    const total = quantity * price;
    return total < this.cashBalance;
  }
}

export default getModelForClass(User);
