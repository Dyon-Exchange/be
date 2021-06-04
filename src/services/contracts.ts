import * as ethers from "ethers";
import config from "../config";
import Contract from "@labrysio/dyon-contracts";
const wallet = new ethers.Wallet(`0x${config.goerliPrivateKey}`).connect(
  new ethers.providers.JsonRpcProvider(config.goerliUrl)
);

export default Contract(wallet);
