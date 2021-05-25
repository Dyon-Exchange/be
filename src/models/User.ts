import {
  prop,
  modelOptions,
  getModelForClass,
  pre,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import isEmail from "validator/lib/isEmail";
import { hashSync } from "bcrypt";

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
  public balance!: number;

  public getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

export default getModelForClass(User);
