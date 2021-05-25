require("dotenv").config();

export default {
  mongoConnectionUrl: process.env.MONGO_URL as string,
  tokenSecret: "secret",
  refreshSecret: "very-secret",
};
