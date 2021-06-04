import M from "mongoose";
import User from "../models/User";
import config from "../config";

export default async function () {
  await M.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // await User.create({
  //   email: "matilda@labrys.io",
  //   password: "password",
  //   balance: 250000,
  //   firstName: "Matilda",
  //   lastName: "Khuu",
  // });
}
