import Router from "koa-joi-router";
import { authRequired } from "../../../services/passport";
import test from "./testPrivate";

const { Joi } = Router;

const router = Router();
authRequired(router);

router.prefix("/user");

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
