// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    
    //const config1Beneficiaries = ["0x621f18127133b591eAdeEA14F2fe95c7695BcE61","0x8985fEE5282eC496D7ddFf1b79e44D951a96a39a","0x61943A66606e6442441fF1483080e7fB10558C91"];
    //const config2Beneficiaries = ["0x621f18127133b591eAdeEA14F2fe95c7695BcE61","0x8985fEE5282eC496D7ddFf1b79e44D951a96a39a","0x61943A66606e6442441fF1483080e7fB10558C91"];
    
    let tx, receipt;
    let totalGasUsed = 0;

    const factoryAddress= "0x2e3c64Ee6d189cbfaA4BdA19045C9683A07509e9"; //rinkeby
    let vestingFactory = await hre.ethers.getContractAt("contracts/vesting/VestingFactory_flat.sol:VestingFactory", factoryAddress);

    // need to send total BICO being vested to vesting factory

    //tx = await vestingFactory.createVestingContract(<beneficiary>, <start>, <cliffDuration>, <duration>, <tokensVested>);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });   