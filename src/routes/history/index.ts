import { Context } from "koa";
import Router from "koa-joi-router";
import AssetPriceEvent from "../../models/AssetPriceEvent";

import { authRequired } from "../../services/passport";

const router = Router();
router.prefix("/history");
authRequired(router);

router.route({
  method: "GET",
  path: "/asset/:productIdentifier",
  handler: async (ctx: Context) => {
    const { productIdentifier } = ctx.params;

    const priceEvents = AssetPriceEvent.find({
      productIdentifier,
    });

    ctx.response.body = { priceEvents };
  },
});
