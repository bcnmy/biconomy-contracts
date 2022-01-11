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


/// Result and observations

/* deployments

npx hardhat run --network kovan scripts/deployTokenUpgradeable.js
Biconomy Token Logic Contract deployed at: 0x89BFc303052154B9289B55db045674f33f343880
Biconomy Token Proxy Contract deployed at: 0xAd0B7333D372699872A76380B176b714e645F4f4
Gas used : 174045

*/


/*
BicoTokenProxy.sol unable to verify on etherscan

Successfully submitted source code for contract
contracts/bico-token/bico/BicoTokenProxy.sol:BicoTokenProxy at 0xAd0B7333D372699872A76380B176b714e645F4f4
for verification on Etherscan. Waiting for verification result...

We tried verifying your contract BicoTokenProxy without including any unrelated one, but it failed.
Trying again with the full solc input used to compile and deploy it.
This means that unrelated contracts may be displayed on Etherscan...

Successfully submitted source code for contract
contracts/bico-token/bico/BicoTokenProxy.sol:BicoTokenProxy at 0xAd0B7333D372699872A76380B176b714e645F4f4
for verification on Etherscan. Waiting for verification result...

Error in plugin @nomiclabs/hardhat-etherscan: The contract verification failed.
Reason: Fail - Unable to verify

Action : use open zeppelin upgrades plugin for deploy and verification!
*/

/*
Implementation verified on etherscan

Successfully submitted source code for contract
contracts/bico-token/bico/BicoTokenImplementation.sol:BicoTokenImplementation at 0x89BFc303052154B9289B55db045674f33f343880
for verification on Etherscan. Waiting for verification result...

Successfully verified contract BicoTokenImplementation on Etherscan.
https://kovan.etherscan.io/address/0x89BFc303052154B9289B55db045674f33f343880#code

Concern : since all read variables are in common storage it should be able to fetch from this contract address also.

oneclickdapp using proxy address and implementation abi below:
https://oneclickdapp.com/madrid-arcade

trusted forwarder seems not initialised in its desired storage properly
variables regarding pausable and access contro las well
*/