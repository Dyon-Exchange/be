import { Context } from "koa";

export default async (ctx: Context) => {
  const user = ctx.state.user;
  ctx.response.body = {
    fullName: user.getFullName(),
    cashBalance: user.cashBalance,
    email: user.email,
  };
};
