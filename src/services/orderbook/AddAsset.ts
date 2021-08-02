import Asset from "../../models/Asset";
import { httpClient } from "./common";

/**
 * Add an Asset to the orderbook
 * @param productIdentifier asset to add to orderbook
 */
async function AddAsset(productIdentifier: string): Promise<void> {
  const [asset] = await Asset.find({ productIdentifier });
  if (!asset) {
    throw new Error(
      `Asset with that productIdentifier ${productIdentifier} does not exist`
    );
  }

  await httpClient.post("/addAsset", {
    Asset: productIdentifier,
  });
}

export default AddAsset;
