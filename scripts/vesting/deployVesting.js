// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    let tx,receipt;
    const bicoAddress= "0x61E0072f5e5b880314db7a59071028e708f88575"; //rinkeby
    const ownerAddress = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const adminAddress = "0x621f18127133b591eAdeEA14F2fe95c7695BcE61"; //our intermediate multisig
    const BicoVesting = await hre.ethers.getContractFactory("BicoVesting");
    const vesting = await BicoVesting.deploy(bicoAddress);
    await vesting.deployed();
    console.log("Vesting Contract deployed at:", vesting.address);

    
    tx = await vesting.setAdmin(adminAddress,true);
    receipt = await tx.wait(1);
    console.log(`Admin address set to ${adminAddress}`);

    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });   