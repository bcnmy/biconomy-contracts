const { estimateGasPrice } = require("../gas-price/get-gas-price");
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  try {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');
    const beneficiary = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const trustedForwarder = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";
    const proxyAdmin = "0x61943A66606e6442441fF1483080e7fB10558C91";
    const accessControlAdmin = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const pauser = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const minter = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const governor = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";

    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei, gasLimit: 10000000 };

    const BicoToken = await hre.ethers.getContractFactory("BicoTokenImplementation");
    const bico = await BicoToken.deploy(options);
    await bico.deployed();
    console.log("✅ Biconomy Token Logic Contract deployed at:", bico.address);
    receipt = await bico.deployTransaction.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    const BicoTokenProxy = await hre.ethers.getContractFactory("BicoTokenProxy");
    const bicoProxy = await BicoTokenProxy.deploy(bico.address, proxyAdmin, options);
    await bicoProxy.deployed();
    console.log("✅ Biconomy Token Proxy Contract deployed at:", bicoProxy.address);
    receipt = await bicoProxy.deployTransaction.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let bicoTokenProxy = await hre.ethers.getContractAt("contracts/bico-token/bico/BicoTokenImplementation.sol:BicoTokenImplementation", bicoProxy.address);
    tx = await bicoTokenProxy.initialize(beneficiary, trustedForwarder, governor, accessControlAdmin, pauser, minter, options);
    receipt = await tx.wait(confirmations = 2);
    console.log("✅ Proxy initialized");
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    console.log(`Initializer:  ${receipt.from}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
  } catch (error) {
    console.log("❌ DEPLOYMENT FAILED ❌")
    console.log(error);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });