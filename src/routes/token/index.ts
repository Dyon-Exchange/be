import { BigNumber } from "@ethersproject/bignumber";
import { Context } from "koa";
import Router from "koa-joi-router";
import { DocumentType } from "@typegoose/typegoose";
import Asset, { Asset as AssetType } from "../../models/Asset";
import Token, { Token as TokenType } from "../../models/Token";
import Contract, { Wallet } from "../../services/contracts";
import { User as UserClass } from "../../models/User";
import { authRequired } from "../../services/passport";

const { Joi } = Router;

const router = Router();
router.prefix("/token");
authRequired(router);

/*
 * Add a new asset and mint token
 */
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
      const tokenId = `${productCode}${caseId}${locationId}${taxCode}${conditionCode}`;
      if (process.env.NODE_ENV !== "test") {
        const contract = await Contract();
        const response = await contract.mint(BigNumber.from(tokenId), supply, {
          gasLimit: 37411,
        });
        await response.wait();
        txHash = response.hash;
      }

      asset = await Asset.create({
        productIdentifier: productCode,
        year,
        name,
        details: {
          blurb: "test blurb",
          colour: "",
          country: "",
          region: "",
          subRegion: "",
          wineAdvocate: "",
          decanter: "",
          jamesSuckling: "",
          jebDunnuck: "",
          vinous: "",
        },
        unitSize: "(6x75cl)",
        changeAmount: "",
        changePercentage: "",
      });

      token = await Token.create({
        productCode,
        caseId,
        locationId,
        taxCode,
        conditionCode,
        tokenId,
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

/*
 * Get token information for supplied tokenId
 */
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

/*
 * Get token metadata for the specified tokenId
 */
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

/*
 * Redeemed token
 */
router.route({
  method: "POST",
  path: "/redeem",
  handler: async (ctx: Context) => {
    const user = ctx.state.user as DocumentType<UserClass>;
    const {
      toRedeem,
    }: { toRedeem: { productIdentifier: string; units: number }[] } =
      ctx.request.body;

    const redeemed: {
      productIdentifier: string;
      units: number;
      txHash: string;
    }[] = [];

    const errors = [];

    for (const item of toRedeem) {
      const { productIdentifier, units } = item;

      const asset = await Asset.findOne({ productIdentifier });
      if (!asset) {
        ctx.throw(400, `Asset ${productIdentifier} does not exist`);
      }
      const token = await Token.findOne({ productCode: productIdentifier });
      if (!token) {
        ctx.throw(400, `Token ${productIdentifier} does not exist`);
      }

      if (token.supply < units) {
        ctx.throw(400, `Cannot burn more tokens than exists`);
      }

      if (user.getAssetQuantity(productIdentifier) < units) {
        ctx.throw(
          401,
          `You do not have enough of ${productIdentifier} to redeem this amount of tokens`
        );
      }

      try {
        const contract = await Contract();
        const response = await contract.burn(
          Wallet.address,
          BigNumber.from(token.tokenId),
          units,
          {
            gasLimit: 12487794,
          }
        );

        await response.wait();

        redeemed.push({
          productIdentifier,
          units,
          txHash: response.hash,
        });

        await user.minusAsset(productIdentifier, units);
        await user.save();

        token.supply = token.supply - units;
        await token.save();
      } catch (e) {
        errors.push(asset.name);
      }
    }

    ctx.response.status = 200;
    ctx.response.body = { redeemed };
  },
});

export default router;
