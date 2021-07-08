import Koa, { Context } from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import Orderbook from "./services/orderbook";
import cron from "node-cron";
import index from "./routes";
import database from "./services/database";
import passport from "koa-passport";
import passportConfig from "./services/passport";
import Asset from "./models/Asset";

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
    if (process.env.NODE_ENV !== "test") {
      console.error(err.message);
    }
    throw err;
  }
});

app.use(index.routes()).use(index.allowedMethods());

// Every 15 minutes
cron
  .schedule("1 * * * * *", async () => {
    await Orderbook.UpdateMarketPrices();
  })
  .start();

// Every day at 1am
cron
  .schedule("0 3 * * *", async () => {
    const assets = await Asset.find({});
    for await (const asset of assets) {
      if (asset.askMarketPrice) {
        asset.addPriceEvent(asset.askMarketPrice, new Date());
      }
    }
  })
  .start();

export default app;
