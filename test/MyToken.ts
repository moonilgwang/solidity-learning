import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersHelpers } from "hardhat/types";

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let singers: HardhatEthersSigners[];
  before("should deploy", async () => {
    singers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
    ]);
  });
  it("should return name", async () => {
    expect(await myTokenC.name()).equal("MyToken");
  });

  it("should return symbol", async () => {
    expect(await myTokenC.symbol()).equal("MT");
  });

  it("should return decimals", async () => {
    expect(await myTokenC.decimals()).equal(18);
  });
  it("should return totalSupply", async () => {
    expect(await myTokenC.totalSupply()).equal(0);
  });
  it("should return balanceOf", async () => {
    expect(await myTokenC.totalSupply()).equal(0);
  });
  it("should return 0 balace for signer 0", async () => {
    const signers0 = singers[0];
    expect(await myTokenC.balanceOf(signers0)).equal(0);
  });
});
