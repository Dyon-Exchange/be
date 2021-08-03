import * as ethers from "ethers";
import config from "../config";
import Config from "../models/Config";
import { newContract, Dyon } from "@labrysio/dyon-contracts";

export const Wallet = new ethers.Wallet(`0x${config.privateKey}`).connect(
  new ethers.providers.JsonRpcProvider(config.ethNodeUrl)
);

let contract: Dyon;
export default async function (): Promise<Dyon> {
  if (!contract) {
    const [config] = await Config.find({});
    if (!config) {
      throw new Error("No contract address in database");
    }
    contract = newContract(config?.contractAddress, Wallet);
  }
  return contract;
}
