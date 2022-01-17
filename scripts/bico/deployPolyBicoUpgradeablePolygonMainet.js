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
    const trustedForwarder = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8";
    const proxyAdmin = "0x9F436e8C090e46FA68453ebDe3241859D5BF3Cc4";
    const accessControlAdmin = "0xea0641FE12E91B94d3C0e171E972648Df64BE41d";
    const pauser = "0xea0641FE12E91B94d3C0e171E972648Df64BE41d";
    const minter = "0xea0641FE12E91B94d3C0e171E972648Df64BE41d";
    const governor = "0xea0641FE12E91B94d3C0e171E972648Df64BE41d";
    const childChainManager = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";

    let tx, receipt;
    let totalGasUsed = 0;

    const PolyBicoToken = await hre.ethers.getContractFactory("PolygonBicoToken");
    const polyBico = await PolyBicoToken.deploy();
    await polyBico.deployed();

    console.log("✅ Biconomy Token Logic Contract deployed on Polygon Mainnet at:", polyBico.address);
    receipt = await polyBico.deployTransaction.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    const BicoTokenProxy = await hre.ethers.getContractFactory("BicoTokenProxy");
    const bicoProxy = await BicoTokenProxy.deploy(polyBico.address, proxyAdmin);
    await bicoProxy.deployed();
    console.log("✅ Biconomy Token Proxy Contract deployed on Polygon Mainnet at:", bicoProxy.address);
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

    console.log("👏 🏁🏁 DEPLOYMENT ON POLYGON FINISHED");
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