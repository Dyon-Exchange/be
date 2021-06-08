import Koa, { Context } from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import index from "./routes";
import database from "./services/database";
import passport from "koa-passport";
import passportConfig from "./services/passport";

const app: Koa = new Koa();

app.use(cors());

(async () => {
  await database();
})();

app.use(
  bodyParser({
    enableTypes: ["json", "form", "text"],
  })
);

passportConfig(passport);
app.use(passport.initialize());

app.use(async (ctx: Context, next: CallBackFunction) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message,
    };
    if(process.env.NODE_ENV !== "test"){
      console.error(err.message);
    }
    throw err;
  }
});

app.use(index.routes()).use(index.allowedMethods());


export default app;
