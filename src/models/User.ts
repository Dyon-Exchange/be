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
import { OrderSide } from "./Order";
import { MarketOrder } from "./MarketOrder";
import LimitOrder, { LimitOrder as LimitOrderClass } from "./LimitOrder";

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

  /**
   * Return the quantity of an asset that a user owns
   */
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

  /**
   * Increment a user's quantity of an asset
   * */
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

  /**
   * Decrement a user's quantity of an asset
   * */
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
      if (this.assets[index].quantity - quantity === 0) {
        this.assets.splice(index, 1);
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
  }

  /**
   * Updates the user's asset balance from an order. Needs the order and the amount filled.
   * */
  public async updateAssetQuantityFromOrder(
    order: MarketOrder | LimitOrderClass,
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

  /**
      Updates the user's cash balance from an order. Needs the amount to update by and the side of the order
   */
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

  /*
   * Whether a user has enough cash to perform a supplied quantity at a certain price
   */
  public hasEnoughBalance(quantity: number, price: number): boolean {
    const total = quantity * price;
    return total < this.cashBalance;
  }

  /**
      Whether a user has a pending order on that side for the asset represented by the productIdentifier
   */
  public async hasPendingOrderOnOtherSide(
    productIdentifier: string,
    side: OrderSide
  ): Promise<boolean> {
    const otherSide = side === "ASK" ? "BID" : "ASK";
    //@ts-ignore
    const orders = await LimitOrder.find({
      productIdentifier,
      side: otherSide,
      // @ts-ignore
      userId: this._id,
      status: "PENDING",
    });
    console.log({ orders });
    console.log(orders.length > 0);
    return orders.length > 0;
  }
}

export default getModelForClass(User);
