import { Context } from "koa";
import Router from "koa-joi-router";
import orderbook from "../../services/orderbook";
import { v4 as uuidv4 } from "uuid";
import LimitOrder from "../../models/LimitOrder";
import MarketOrder from "../../models/MarketOrder";
import { authRequired } from "../../services/passport";

const { Joi } = Router;

const router = Router();
router.prefix("/order");
authRequired(router);

router.route({
  method: "GET",
  path: "/user",
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const limitOrders = await LimitOrder.find({ userId: user._id });
    const marketOrders = await MarketOrder.find({ userId: user._id });
    ctx.body = {
      limitOrders,
      marketOrders,
    };
  },
});

router.route({
  method: "PUT",
  path: "/limitOrder",
  validate: {
    body: {
      productIdentifier: Joi.string().length(18).required(),
      side: Joi.string().required(),
      quantity: Joi.number().required(),
      price: Joi.number().required(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const { productIdentifier, side, quantity, price } = ctx.request.body;

    if (!user.hasEnoughBalance(quantity, price) && side == "BID") {
      ctx.throw(
        400,
        `User does not have enough cash to make this order ${
          price * quantity
        } > ${user.cashBalance}`
      );
    }

    if (user.getAssetQuantity(productIdentifier) < quantity && side == "ASK") {
      ctx.throw(400, "User does not have enough asset to sell that quantity");
    }

    const order = await LimitOrder.create({
      userId: user._id,
      price,
      productIdentifier,
      side,
      quantity,
      orderId: uuidv4(),
      status: "PENDING",
      filled: 0,
      matched: [],
    });
    await order.save();

    await orderbook.addLimitOrder(order);

    ctx.response.status = 200;
  },
});

router.route({
  method: "PUT",
  path: "/marketOrder",
  validate: {
    body: {
      productIdentifier: Joi.string().length(18).required(),
      side: Joi.string().required(),
      quantity: Joi.number().required(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const user = ctx.state.user;
    const { productIdentifier, side, quantity } = ctx.request.body;

    const order = await MarketOrder.create({
      userId: user._id,
      productIdentifier,
      side,
      quantity,
      orderId: uuidv4(),
      status: "PENDING",
      filled: 0,
      matched: [],
    });
    await order.save();

    await orderbook.addMarketOrder(order);

    ctx.response.status = 200;
  },
});

router.route({
  method: "POST",
  path: "/cancelOrder",
  validate: {
    body: { orderId: Joi.string().required() },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const { orderId } = ctx.request.body;
    const user = ctx.state.user;

    const limitOrder = await LimitOrder.findOne({ orderId });
    const marketOrder = await MarketOrder.findOne({ orderId });
    const order = limitOrder ? limitOrder : marketOrder;
    if (!order) {
      ctx.throw(404, "No order with that id exists");
    }

    if (order.userId !== user._id.toString()) {
      ctx.throw(403, "Cannot cancel order that user does not own");
    }

    if (order.status === "COMPLETE") {
      ctx.throw(400, "Cannot cancel completed order");
    }

    await orderbook.cancelOrder(order);
    ctx.response.status = 200;
  },
});

router.route({
  method: "POST",
  path: "/calculateMarketPrice",
  validate: {
    body: {
      quantity: Joi.number().required(),
      productIdentifier: Joi.string().required(),
      side: Joi.string().required(),
    },
    type: "json",
  },
  handler: async (ctx: Context) => {
    const { quantity, productIdentifier, side } = ctx.request.body;
    try {
      const price = await orderbook.calculateMarketPrice(
        productIdentifier,
        quantity,
        side
      );
      ctx.response.body = { price };
    } catch (e) {
      console.log("error", e);
      ctx.throw(400, e);
    }
  },
});

export default router;
