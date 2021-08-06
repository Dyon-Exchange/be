import { BigNumber } from "@ethersproject/bignumber";
import Contract, { Wallet } from "../src/services/contracts";
import database from "../src/services/database";
import Asset, { Asset as AssetType } from "../src/models/Asset";
import Token, { Token as TokenType } from "../src/models/Token";

async function mint() {
  const contract = await Contract();
  const response = await contract.mint(BigNumber.from("2"), 100, {
    gasLimit: 12487794,
  });
  await response.wait();
  console.log(response);
}

async function main() {
  const contract = await Contract();
  const token = (await Token.find())[0];
  console.log(
    (
      await contract.balanceOf(Wallet.address, BigNumber.from(token.tokenId))
    ).toNumber()
  );

  const response = await contract.burn(
    Wallet.address,
    BigNumber.from(token.tokenId),
    1,
    {
      gasLimit: 12487794,
    }
  );

  console.log(response);
  await response.wait();
  console.log(response);

  console.log(
    (
      await contract.balanceOf(Wallet.address, BigNumber.from(token.tokenId))
    ).toNumber()
  );
}

(async () => {
  await database();
  //  await main();
  await mint();
})();
