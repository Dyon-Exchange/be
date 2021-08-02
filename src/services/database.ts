import Mongoose from "mongoose";
import config from "../config";

/*
 * Drop the database. Used in the database population scripts
 */
export async function dropDatabase(): Promise<void> {
  await Mongoose.connection.db.dropDatabase();
}

export default async function (): Promise<void> {
  await Mongoose.connect(config.mongoConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
