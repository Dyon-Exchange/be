import { Context } from "koa";
import Router from "koa-joi-router";
import Orderbook from "../../services/orderbook";
import Asset from "../../models/Asset";
import { getRand } from "../asset/index";

const router = Router();

router.prefix("/tasks");

router.get("/updateMarketPrices", async (ctx: Context) => {
  for (let i = 0; i < 55; i++) {
    await Orderbook.UpdateMarketPrices();
    await new Promise((r) => setTimeout(r, 1000));
  }

  ctx.response.status = 200;
  ctx.response.body = "Success";
});

router.get("/updateChangePercentages", async (ctx: Context) => {
  const assets = await Asset.find({});
  for await (const asset of assets) {
    if (asset.askMarketPrice) {
      asset.addPriceEvent(asset.askMarketPrice, new Date());
    }

    const changePercentage = getRand(-15, 15);

    let changeAmount = 0;
    if (changePercentage > 0) {
      if (asset.bidMarketPrice) {
        changeAmount =
          (Math.abs(changePercentage) / asset.bidMarketPrice) * 100;
      } else {
        changeAmount = getRand(1000, 2000);
      }
    } else {
      if (asset.bidMarketPrice) {
        changeAmount =
          (Math.abs(changePercentage) / asset.bidMarketPrice) * 100;
      } else {
        changeAmount = getRand(-1000, -2000);
      }
    }
    asset.changeAmount = changeAmount;
    asset.changePercentage = changePercentage;
    await asset.save();
  }
  ctx.response.status = 200;
  ctx.response.body = "Success";
});

export default router;
