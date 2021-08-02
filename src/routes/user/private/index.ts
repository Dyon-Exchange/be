import Router from "koa-joi-router";
import { authRequired } from "../../../services/passport";
import get from "./get";

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

export default router;
