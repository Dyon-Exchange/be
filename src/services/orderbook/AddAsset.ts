import { httpClient } from "./common";

/*
 * Add an Asset to the orderbook
 */
async function AddAsset(productIdentifier: string): Promise<void> {
  await httpClient.post("/addAsset", {
    Asset: productIdentifier,
  });
}

export default AddAsset;
