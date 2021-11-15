import mongoose from "mongoose";

import config from "../config";

export default () =>
  mongoose.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);
