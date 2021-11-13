// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const bicoAddress= "0x61E0072f5e5b880314db7a59071028e708f88575";
    const VestingFactory = await hre.ethers.getContractFactory("VestingFactory");
    const factory = await VestingFactory.deploy(bicoAddress);

    await factory.deployed();

    console.log("Vesting Factory deployed to:", factory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });   