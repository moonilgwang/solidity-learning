import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    // ManagedAccess.sol에 맞춰서 일부 수정
    const managers = [
      signers[1].address,
      signers[2].address,
      signers[3].address,
    ];
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      managers,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers,
    ]);
    const tinyBankAddress = await tinyBankC.getAddress();
    await myTokenC.setManager([tinyBankAddress]);
  });

  describe("Initializaed state check", () => {
    it("hsould return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });
  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC)).equal(
        await tinyBankC.totalStaked(),
      );
      expect(await tinyBankC.totalStaked()).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });
  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT every block", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()),
      );
    });
    it("Should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[4];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });
  });
  describe("Assignment #3: Multi Manager", () => {
    const rewardToChange = hre.ethers.parseUnits("500", DECIMALS);

    it("1. Should revert with 'You are not a manager' when called by a non-manager", async () => {
      const hacker = signers[4];
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });

    it("2-1. Should revert with 'Not all confirmed yet' when a manager has confirmed", async () => {
      const manager1 = signers[1];

      await tinyBankC.connect(manager1).confirm();
      await expect(
        tinyBankC.connect(manager1).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });
    it("2-2. Should revert with 'Not all confirmed yet' when two managers have confirmed", async () => {
      const manager1 = signers[1];
      const manager2 = signers[2];

      await tinyBankC.connect(manager1).confirm();
      await tinyBankC.connect(manager2).confirm();

      await expect(
        tinyBankC.connect(manager2).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });
    it("2-3. Should succeed when all managers have confirmed", async () => {
      const manager1 = signers[1];
      const manager2 = signers[2];
      const manager3 = signers[3];

      await tinyBankC.connect(manager1).confirm();
      await tinyBankC.connect(manager2).confirm();
      await tinyBankC.connect(manager3).confirm();

      await tinyBankC.connect(manager3).setRewardPerBlock(rewardToChange);

      expect(await tinyBankC.rewardPerBlock()).to.equal(rewardToChange);
    });
  });
});
