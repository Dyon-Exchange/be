import Router from "koa-router";
import { Context, DefaultState } from "koa";

const router = new Router<DefaultState, Context>();
const index = async (ctx: Context) => {
  ctx.body = "Welcome to the WineBit";
};

router.get("/", index);
router.post("/", index);

export default router;
