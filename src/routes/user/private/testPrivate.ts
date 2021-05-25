import { Context } from "koa";

export default async (ctx: Context) => {
  ctx.body = { test: "test-data" };
  ctx.response.status = 200;
};
