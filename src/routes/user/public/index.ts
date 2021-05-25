import Router from "koa-joi-router";
import isEmail from "validator/lib/isEmail";
import login from "./login";

const { Joi } = Router;

const router = Router();
router.prefix("/user");

router.route({
  method: "post",
  path: "/login",
  validate: {
    body: {
      email: Joi.string()
        .required()
        .custom((value) => isEmail(value) && value),
      password: Joi.string().required(),
    },
    type: "json",
    output: {
      200: {
        body: {
          token: Joi.string().required(),
          refreshToken: Joi.string().required(),
        },
      },
    },
  },
  handler: login,
});

export default router;
