import M from "mongoose";
import config from "../config";

export default async function (): Promise<void> {
  await M.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
