// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const beneficiary = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
  const trustedForwarder = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E";
  const BicoToken = await hre.ethers.getContractFactory("BicoToken");
  const bico = await BicoToken.deploy(beneficiary,trustedForwarder);

  await bico.deployed();

  console.log("Biconomy Token deployed to:", bico.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
