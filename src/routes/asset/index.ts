import { Context } from "koa";
import Router, { Joi } from "koa-joi-router";
import multer from "@koa/multer";
import Asset from "../../models/Asset";

const upload = multer();
const router = Router();
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

export default router;
