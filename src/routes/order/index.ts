import { Context } from "koa";
import Router from "koa-joi-router";
import orderbook, { GetOrdersResponse } from "../../services/orderbook";
import LimitOrder from "../../models/LimitOrder";
import MarketOrder from "../../models/MarketOrder";
import { authRequired } from "../../services/passport";
import { debugLog } from "../../helpers/debugLog";

const { Joi } = Router;

const router = Router();
router.prefix("/order");
authRequired(router);

/*
 * Get all of a user's orders
 */
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

/*
 * Add a limit order to the orderbook
 */
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

    const order = await orderbook
      .AddLimitOrder(productIdentifier, side, quantity, price, user)
      .catch((e) => ctx.throw(400, e));

    ctx.response.status = 200;
    ctx.response.body = order;
  },
});

/*
 * Add a market order to the orderbook
 */
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
    const order = await orderbook
      .AddMarketOrder(productIdentifier, side, quantity, user)
      .catch((e) => ctx.throw(400, e));

    ctx.response.body = order;
    ctx.response.status = 200;
  },
});

/*
 * Cancel an order
 */
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

    await orderbook.CancelOrder(order);
    ctx.response.status = 200;
  },
});

/*
 * Calculate the market price for the supplied productIdentifier, quantity and order side
 */
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
      const price = await orderbook.CalculateMarketPrice(
        productIdentifier,
        quantity,
        side
      );

      if (price) {
        ctx.response.body = { price: Number(price) };
      } else {
        ctx.response.status = 404;
      }
    } catch (e) {
      console.log("error", e);
      ctx.throw(400, e);
    }
  },
});

router.get("/orderbook/:productIdentifier", async (ctx: Context) => {
  const { productIdentifier } = ctx.params;
  debugLog(productIdentifier);
  let orders: GetOrdersResponse;
  try {
    orders = await orderbook.GetOrders(productIdentifier);
  } catch (err) {
    ctx.throw(400, err.message);
  }
  ctx.response.body = orders;
  ctx.response.status = 200;
});

export default router;
