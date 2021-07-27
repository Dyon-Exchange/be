import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { Context } from "koa";
import config from "../../../config";
import User from "../../../models/User";

export default async (ctx: Context): Promise<void> => {
  const { password, email } = ctx.request.body;

  const user = await User.findOne({ email });
  if (!user) {
    ctx.throw(404, "Account not found.");
  }

  if (!(await compare(password, user.password))) {
    ctx.throw(401, "Password is incorrect");
  }

  const payload = {
    id: user._id,
  };

  const token = sign(payload, config.tokenSecret, { expiresIn: 36000 });
  const refreshToken = sign(payload, config.refreshSecret, {
    expiresIn: "7d",
  });

  ctx.body = { token, refreshToken };
};
