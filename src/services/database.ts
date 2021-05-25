import M from "mongoose";
import User from "../models/User";
import config from "../config";

export default async function () {
  await M.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // await User.create({
  //   email: "conor@labrys.io",
  //   password: "password2021",
  //   balance: 250000,
  // });
}
