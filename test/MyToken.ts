import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });
  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });

    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });

    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });
    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });
  });

  describe("Mint", () => {
    it("should return 1MT balace for signer 0", async () => {
      const signers0 = signers[0];
      expect(await myTokenC.balanceOf(signers0)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });
  });

  describe("Transfer", () => {
    it("shoud have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", DECIMALS),
          signer1.address,
        ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", DECIMALS),
        );
      // const receipt = await tx.wait();
      // console.log(receipt?.logs);
      expect(await myTokenC.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("0.5", DECIMALS),
      );

      // const filter = myTokenC.filters.Transfer(signer0.address);
      // const logs = await myTokenC.queryFilter(filter, 0, "latest");
      // console.log(logs.length);
      // console.log(logs[0].args.from);
      // console.log(logs[0].args.to);
      // console.log(logs[0].args.value);
    });
    it("shoud be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
          signer1.address,
        ),
      ).to.be.revertedWith("insufficient balance");
    });
  });
  describe("TransferFrom", () => {
    it("should emit approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(
          signer1.address,
          hre.ethers.parseUnits("10", DECIMALS),
        ),
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    });
    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", DECIMALS),
          ),
      ).to.be.revertedWith("insufficient allowance");
    });
  });
  describe("Assignment for transferFrom & approve", () => {
    const amount = hre.ethers.parseUnits("10", DECIMALS);

    it("1. approve: Grant signer1 permission to transfer signer0's assets.", async () => {
      const signer1 = signers[1];

      await expect(myTokenC.approve(signer1.address, amount))
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, amount);

      expect(
        await myTokenC.allowance(signers[0].address, signer1.address),
      ).equal(amount);
    });

    it("2. transferFrom: Have signer1 transfer signer0's MT tokens to signer1's own address.", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];

      await myTokenC.approve(signer1.address, amount);

      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(signer0.address, signer1.address, amount),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(signer0.address, signer1.address, amount);
    });

    it("3. check balances", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];

      const initialSigner0Balance = MINTING_AMOUNT * 10n ** DECIMALS;

      await myTokenC.approve(signer1.address, amount);

      await myTokenC
        .connect(signer1)
        .transferFrom(signer0.address, signer1.address, amount);

      // signer0: 100 MT - 10 MT = 90 MT
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        initialSigner0Balance - amount,
      );

      // signer1: 0 MT + 10 MT = 10 MT
      expect(await myTokenC.balanceOf(signer1.address)).equal(amount);
    });
  });
});
