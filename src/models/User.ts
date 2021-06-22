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
import { OrderSide } from "./Order";

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

  public async addAsset(
    productIdentifier: string,
    quantity: number
  ): Promise<void> {
    const index = this.assets.findIndex(
      (a: any) => a.productIdentifier === productIdentifier
    );

    if (index === -1) {
      this.assets.push({
        productIdentifier,
        quantity,
      });
      // @ts-ignore
      await this.save();
    } else {
      // @ts-ignore
      await this.update(
        {
          $set: {
            "assets.$[el].quantity": this.assets[index].quantity + quantity,
          },
        },
        {
          arrayFilters: [{ "el.productIdentifier": productIdentifier }],
          new: true,
        }
      );
    }
  }

  public async minusAsset(
    productIdentifier: string,
    quantity: number
  ): Promise<void> {
    const index = this.assets.findIndex(
      (a: any) => a.productIdentifier === productIdentifier
    );

    if (index === -1) {
      throw new Error(
        `${this.email} does not have any of this asset $productIdentifier}.`
      );
    } else {
      // @ts-ignore
      await this.update(
        {
          $set: {
            "assets.$[el].quantity": this.assets[index].quantity - quantity,
          },
        },
        {
          arrayFilters: [{ "el.productIdentifier": productIdentifier }],
          new: true,
        }
      );
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
      await this.minusAsset(order.productIdentifier, filled);
    } else if (order.side === "BID") {
      await this.addAsset(order.productIdentifier, filled);
    } else {
      throw new Error("Invalid order side");
    }
    // @ts-ignore
    await this.save();
  }

  public async updateCashBalanceFromOrder(
    amount: number,
    orderSide: "buy" | "sell"
  ): Promise<void> {
    if (orderSide === "sell") {
      this.cashBalance += amount;
    } else if (orderSide === "buy") {
      this.cashBalance -= amount;
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
