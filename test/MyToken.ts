import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let singers: HardhatEthersSigner[];
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
    expect(await myTokenC.totalSupply()).equal(1n * 10n ** 18n);
  });
  it("should return 1MT balace for signer 0", async () => {
    const signers0 = singers[0];
    expect(await myTokenC.balanceOf(signers0)).equal(1n * 10n ** 18n);
  });
});
