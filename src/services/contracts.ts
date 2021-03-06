import * as ethers from "ethers";
import config from "../config";
import Contract from "@labrysio/dyon-contracts";
const wallet = new ethers.Wallet(`0x${config.privateKey}`).connect(
  new ethers.providers.JsonRpcProvider(config.ethNodeUrl)
);

export default Contract(wallet);
