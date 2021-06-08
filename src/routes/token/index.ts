import { BigNumber } from "@ethersproject/bignumber";
import { Context } from "koa";
import Router from "koa-joi-router";
import Asset, { Asset as AssetType } from "../../models/Asset";
import Token, { Token as TokenType } from "../../models/Token";
import Contract from "../../services/contracts";

const { Joi } = Router;

const router = Router();
router.prefix("/token");

router.route({
  method: "PUT",
  path: "/",
  validate: {
    body: {
      productCode: Joi.string().length(18).regex(/^\d+$/),
      caseId: Joi.string().length(8).regex(/^\d+$/),
      locationId: Joi.string().length(3).regex(/^\d+$/),
      taxCode: Joi.string().length(3).regex(/^\d+$/),
      conditionCode: Joi.string().length(3).regex(/^\d+$/),
      year: Joi.string().required(),
      name: Joi.string().required(),
      supply: Joi.number().required(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const {
      productCode,
      caseId,
      locationId,
      taxCode,
      conditionCode,
      name,
      year,
      supply,
    } = ctx.request.body;

    let asset: AssetType | undefined;
    let token: TokenType | undefined;
    let txHash = "";

    try {
      if (process.env.NODE_ENV !== "test") {
        console.log(process.env);
        const response = await Contract.mint(
          BigNumber.from(`${productCode}${caseId}${locationId}${taxCode}`),
          supply
        );
        await response.wait();
        txHash = response.hash;
      }

      asset = await Asset.create({
        productIdentifier: productCode,
        year,
        name,
      });

      token = await Token.create({
        productCode,
        caseId,
        locationId,
        taxCode,
        conditionCode,
        tokenId: `${productCode}${caseId}${locationId}${taxCode}${conditionCode}`,
        productIdentifier: `${productCode}${locationId}${taxCode}${conditionCode}`,
        supply,
      });
    } catch (e) {
      ctx.throw(400, e);
    }

    ctx.body = {
      asset,
      token,
      txHash,
    };
  },
});

router.route({
  method: "GET",
  path: "/:tokenId",
  handler: async (ctx: Context) => {
    const { tokenId } = ctx.request.params;
    const token = await Token.findOne({ tokenId });
    if (!token) {
      ctx.throw(404, "Token with that id doesn't exist");
    }
    ctx.response.body = token;
  },
});

router.route({
  method: "GET",
  path: "/metadata/:tokenId.json",
  validate: {
    output: {
      200: {
        body: {
          productCode: Joi.string().length(18).regex(/^\d+$/),
          caseId: Joi.string().length(8).regex(/^\d+$/),
          locationId: Joi.string().length(3).regex(/^\d+$/),
          taxCode: Joi.string().length(3).regex(/^\d+$/),
          conditionCode: Joi.string().length(3).regex(/^\d+$/),
        },
      },
    },
  },
  handler: async (ctx: Context) => {
    const { tokenId } = ctx.request.params;
    const token = await Token.findOne({ tokenId });
    if (!token) {
      ctx.throw(404, "Token with that id doesn't exist");
    }

    ctx.response.body = {
      productCode: token.productCode,
      caseId: token.caseId,
      locationId: token.locationId,
      taxCode: token.taxCode,
      conditionCode: token.conditionCode,
    };

    ctx.status = 200;
  },
});

export default router;
