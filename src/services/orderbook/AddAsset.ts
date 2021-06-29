import { httpClient } from "./common";
async function AddAsset(productIdentifier: string): Promise<void> {
  await httpClient.post("/addAsset", {
    Asset: productIdentifier,
  });
}

export default AddAsset;
