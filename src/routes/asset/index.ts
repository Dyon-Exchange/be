import { Context } from "koa";
import Router, { Joi } from "koa-joi-router";
import multer from "@koa/multer";
import Asset from "../../models/Asset";
import AssetPriceEvent from "../../models/AssetPriceEvent";
import { authRequired } from "../../services/passport";
import { Dictionary } from "lodash";
import PriceEvent from "../../models/AssetPriceEvent";
import config from "../../config";

const upload = multer();
const router = Router();
authRequired(router);
router.prefix("/asset");

router.route({
  method: "GET",
  path: "/",
  handler: async (ctx: Context) => {
    const assets = await Asset.find({});

    ctx.body = {
      assets,
    };
  },
});

router.route({
  method: "GET",
  path: "/data/:productIdentifier",
  handler: async (ctx: Context) => {
    const { productIdentifier } = ctx.params;
    const asset = await Asset.findOne({ productIdentifier });

    const priceEvents = await AssetPriceEvent.find({
      productIdentifier,
    });

    if (!asset) {
      ctx.throw(404, "Asset with that product identifier does not exist");
    }

    ctx.body = {
      asset,
      priceEvents,
    };
  },
});

router.route({
  method: "GET",
  path: "/user",
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const userAssets = user.assets;
    const assets = await Asset.find({
      productIdentifier: {
        $in: userAssets.map((a: any) => a.productIdentifier),
      },
    });

    userAssets.map((userAsset: any) => {
      const filtered = assets.filter(
        (asset) => asset.productIdentifier == userAsset.productIdentifier
      );
      userAsset.asset = filtered[0];
    });

    let portfolioBalance = userAssets.reduce((acc: any, curr: any) => {
      if (curr.asset.askMarketPrice) {
        acc += curr.quantity * curr.asset.askMarketPrice;
      }
      return acc;
    }, 0);
    portfolioBalance += user.cashBalance;

    userAssets.map((userAsset: any) => {
      if (userAsset.asset.askMarketPrice) {
        userAsset.portfolioShare =
          ((userAsset.asset.askMarketPrice * userAsset.quantity) /
            portfolioBalance) *
          100;
      }
    });

    ctx.body = {
      assets: userAssets,
      portfolioBalance,
    };
  },
});

router.put(
  "/image/:productIdentifier",
  upload.single("image"),
  async (ctx: Context) => {
    const { productIdentifier } = ctx.request.params;

    const asset = await Asset.findOne({ productIdentifier });
    if (!asset) {
      ctx.throw(404, "Asset with that product identifier doesn't exist");
    }

    try {
      await asset.uploadImage(ctx.file);
      await asset.save();
    } catch (e) {
      ctx.throw(500, e.message);
    }
    ctx.body = asset;
  }
);

router.route({
  method: "PUT",
  path: "/user",
  validate: {
    body: {
      productIdentifier: Joi.string().length(18),
      quantity: Joi.number().required(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const { productIdentifier, quantity } = ctx.request.body;

    const asset = await Asset.findOne({ productIdentifier });
    if (!asset) {
      ctx.throw(404, "No asset with that productIdentifier exists");
    }

    await user.update(
      {
        $set: {
          "assets.$[el].quantity": quantity,
        },
      },
      {
        arrayFilters: [{ "el.productIdentifier": productIdentifier }],
        new: true,
      }
    );
    await user.save();
    ctx.response.status = 200;
  },
});

export default router;
