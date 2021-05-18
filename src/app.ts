import Koa, { Context } from "koa";
import bodyParser from "koa-bodyparser";
import index from "./routes";

const app: Koa = new Koa();

app.use(
  bodyParser({
    enableTypes: ["json", "form", "text"],
  })
);

app.use(async (ctx: Context, next: CallBackFunction) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message,
    };
    console.log(err.message);
  }
});

app.use(index.routes()).use(index.allowedMethods());

export default app;
