import Router from "koa-router";
import { Context, DefaultState } from "koa";
import User from "./user";
import Token from "./token";
import Order from "./order";
import Asset from "./asset";
import Tasks from "./tasks";

const router = new Router<DefaultState, Context>();
const index = async (ctx: Context) => {
  ctx.body = "Welcome to the WineBit";
};

router.get("/", index);
router.post("/", index);

router.use(
  User.Public.middleware(),
  User.Private.middleware(),
  Token.middleware(),
  Asset.middleware(),
  Order.middleware(),
  Tasks.middleware()
);

export default router;
