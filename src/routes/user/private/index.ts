import Router from "koa-joi-router";
import { authRequired } from "../../../services/passport";
import get from "./get";
import test from "./testPrivate";

const { Joi } = Router;

const router = Router();
authRequired(router);

router.prefix("/user");

/*
 * Get user details
 */
router.route({
  method: "get",
  path: "/",
  validate: {
    output: {
      200: {
        body: {
          fullName: Joi.string().required(),
          cashBalance: Joi.number().required(),
          email: Joi.string().required(),
        },
      },
    },
  },
  handler: get,
});

/*
 * Test route for private routes
 */
router.route({
  method: "get",
  path: "/test",
  validate: {
    output: {
      200: {
        body: {
          test: Joi.string().required(),
        },
      },
    },
  },
  handler: test,
});

export default router;
