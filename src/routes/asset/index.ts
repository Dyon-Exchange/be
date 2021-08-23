import { Context } from "koa";
import Router, { Joi } from "koa-joi-router";
import multer from "@koa/multer";
import { DocumentType } from "@typegoose/typegoose";
import Asset, { Asset as AssetClass } from "../../models/Asset";
import AssetPriceEvent from "../../models/AssetPriceEvent";
import { debugLog } from "../../helpers/debugLog";
import { authRequired } from "../../services/passport";

const upload = multer();
const router = Router();
authRequired(router);
router.prefix("/asset");

/**
 *
 * @param min minimum of range to get random number in
 * @param max maximum of range to get random in
 * @returns random number between range
 */
export function getRand(min: number, max: number): number {
  const num = Math.random() * (max - min) + min;
  return Number(num.toFixed(2));
}

/**
 * Get data for all assets
 * Paginated data
 */
router.route({
  method: "GET",
  path: "/",
  validate: {
    query: {
      limit: Joi.number().required(),
      start: Joi.number().required(),
    },
  },
  handler: async (ctx: Context) => {
    debugLog("hitting endpoint");

    const limit = ctx.request.query.limit as any;
    const start = (ctx.request.query.start as any) ?? 0;

    debugLog("ok lets see");
    debugLog(limit);
    debugLog(start);

    const assets = await Asset.find({}).limit(limit).skip(start);

    const total = await Asset.find({}).countDocuments();

    console.log("got stuff from db");

    const marketAssets: any[] = []; // eslint-disable-line

    await Promise.all(
      assets.map(async (asset: DocumentType<AssetClass>) => {
        marketAssets.push({
          lastPriceAction: await asset.getMostRecentMarketPrice(),
          volume: await asset.getTradingVolume(),
          marketCap: await asset.getMarketCap(),
          ...asset.toObject(),
        });
      })
    );

    ctx.body = {
      assets: marketAssets,
      total,
      limit,
      start,
      nextStart: start + limit,
    };
  },
});

/*
 * Retrieve all assets containing the product identifiers supplied in the array included in the request body
 */
router.route({
  method: "POST",
  path: "/get-many",
  validate: {
    body: {
      prodIds: Joi.array(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const { prodIds }: { prodIds: Array<string> } = ctx.request.body;
    // const qryLength = prodIds.length;

    const assets = await Asset.find({
      productIdentifier: { $in: [...prodIds] },
    });

    // validate

    ctx.body = { assets };
  },
});

/*
 * Get data for a specific asset
 */
router.route({
  method: "GET",
  path: "/data/:productIdentifier",
  handler: async (ctx: Context) => {
    const { productIdentifier } = ctx.params;
    const [asset] = await Asset.find({ productIdentifier });
    if (!asset) {
      ctx.throw(404, "Asset with that product identifier does not exist");
    }

    const priceEvents = await AssetPriceEvent.find({
      productIdentifier,
    });

    ctx.body = {
      asset,
      priceEvents,
    };
  },
});

/**
 * Get user asset details
 */
router.route({
  method: "GET",
  path: "/user",
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const userAssets: any = user.assets; // eslint-disable-line
    const assets = (
      await Asset.find({
        productIdentifier: {
          $in: userAssets.map((a: any) => a.productIdentifier), //eslint-disable-line
        },
      })
    ).map((asset) => asset.toObject());

    // eslint-disable-next-line
    userAssets.map((userAsset: any) => {
      const filtered = assets.filter(
        (asset) => asset.productIdentifier == userAsset.productIdentifier
      );
      userAsset.asset = filtered[0];
    });

    //eslint-disable-next-line
    let portfolioBalance = userAssets.reduce((acc: any, curr: any) => {
      if (curr.asset.askMarketPrice) {
        acc += curr.quantity * curr.asset.askMarketPrice;
      }
      return acc;
    }, 0);
    portfolioBalance += user.cashBalance;

    //eslint-disable-next-line
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

/*
 * Add an image for an asset
 */
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

/*
 * Update a user's quantity of an asset
 */
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
