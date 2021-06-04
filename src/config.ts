import Fs from "fs";
import Util from "util";
require("dotenv").config();

// If on production write contents of google key env variable to json file for use by cloud storage
(async () => {
  if (process.env.GOOGLE_KEY) {
    const write = Util.promisify(Fs.writeFile);
    await write("cru-world-wine-f26f2d45dfc5.json", process.env.GOOGLE_KEY);
  }
})();

let mongoConnectionUrl;
if (process.env.NODE_ENV === "test") {
  mongoConnectionUrl = "mongodb://127.0.0.1:27017/dyon";
} else {
  mongoConnectionUrl = process.env.MONGO_URL as string;
}

if (!process.env.GOERLI_URL) {
  throw new Error("GOERLI_URL missing");
}

if (!process.env.GOERLI_PRIVATE_KEY) {
  throw new Error("GOERLI_PRIVATE_KEY missing");
}

if (!process.env.GCLOUD_PROJECT_ID) {
  throw new Error("GCLOUD_PROJECT_ID missing");
}

if (!process.env.STORAGE_BUCKET) {
  throw new Error("STORAGE_BUCKET missing");
}

const goerliPrivateKey = process.env.GOERLI_PRIVATE_KEY;
const goerliUrl = process.env.GOERLI_URL;

const gcloudProjectId = process.env.GCLOUD_PROJECT_ID;
const storageBucket = process.env.STORAGE_BUCKET;

export default {
  mongoConnectionUrl,
  tokenSecret: "secret",
  refreshSecret: "very-secret",
  goerliPrivateKey,
  goerliUrl,
  storageBucket,
  gcloudProjectId,
};
