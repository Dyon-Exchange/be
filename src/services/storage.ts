import { Storage } from "@google-cloud/storage";
import config from "../config";

const gcs = new Storage({
  projectId: config.gcloudProjectId,
  keyFile: "../cru-world-wine-f26f2d45dfc5.json",
});

const Bucket = gcs.bucket(config.storageBucket);

export default (formData: any, bucketPath: string): Promise<void> => {
  const file = Bucket.file(bucketPath);

  return new Promise((resolve) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: formData.mimetype,
        cacheControl: "no-cache, max-age=0",
      },
    });

    stream.on("finish", () => {
      resolve();
    });
    stream.end(formData.buffer);
  });
};
