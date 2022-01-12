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
    const beneficiary = "0x0000000000000000000000000000000000000000";
    const trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b";
    const proxyAdmin = "0x61943A66606e6442441fF1483080e7fB10558C91";
    const accessControlAdmin = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const pauser = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const minter = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const governor = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6";

    let tx, receipt;
    let totalGasUsed = 0;

    const PolyBicoToken = await hre.ethers.getContractFactory("PolygonBicoToken");
    const polyBico = await PolyBicoToken.deploy();
    await polyBico.deployed();

    console.log("✅ Biconomy Token Logic Contract deployed on mumbai at:", polyBico.address);
    receipt = await polyBico.deployTransaction.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    const BicoTokenProxy = await hre.ethers.getContractFactory("BicoTokenProxy");
    const bicoProxy = await BicoTokenProxy.deploy(polyBico.address, proxyAdmin);
    await bicoProxy.deployed();
    console.log("✅ Biconomy Token Proxy Contract deployed at:", bicoProxy.address);
    receipt = await bicoProxy.deployTransaction.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let bicoTokenProxy = await hre.ethers.getContractAt("contracts/bico-token/bico/PolygonBicoToken.sol:PolygonBicoToken", bicoProxy.address);
    tx = await bicoTokenProxy.polygonBico_init(beneficiary, trustedForwarder, governor, accessControlAdmin, pauser, minter, childChainManager);
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