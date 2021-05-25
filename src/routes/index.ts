import Router from "koa-router";
import { Context, DefaultState } from "koa";
import User from "./user";

const router = new Router<DefaultState, Context>();
const index = async (ctx: Context) => {
  ctx.body = "Welcome to the WineBit";
};

router.get("/", index);
router.post("/", index);

router.use(User.Public.middleware(), User.Private.middleware());

export default router;
