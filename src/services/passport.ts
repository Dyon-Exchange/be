import { ExtractJwt, Strategy } from "passport-jwt";
import passport from "koa-passport";
import { sign, verify } from "jsonwebtoken";
import UserModel, { User } from "../models/User";
import config from "../config";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.tokenSecret,
};

interface RefreshToken {
  id: string;
  iat: number;
  exp: number;
}

export default (p: { use: (arg0: Strategy) => void }) => {
  p.use(
    new Strategy(opts, async (payload: any, done: any) => {
      const user = await UserModel.findById(payload.id);

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    })
  );
};

// Wrapper to protect routes where user auth is required
export function authRequired(router: any): void {
  router.use(passport.authenticate("jwt", { session: false }));
}

export async function processRefreshToken(refreshToken: any) {
  const decoded: RefreshToken = await new Promise((resolve, reject) => {
    verify(refreshToken, config.refreshSecret, (err: any, d: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(d);
      }
    });
  });

  const entity: any = (await UserModel.findById(decoded.id)) as User;

  const payload = {
    id: entity._id,
  };

  const token = sign(payload, config.tokenSecret, { expiresIn: 36000 });
  const newRefreshToken = sign(payload, config.refreshSecret, {
    expiresIn: "7d",
  });

  return { token, refreshToken: newRefreshToken };
}
