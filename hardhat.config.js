require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
const walletUtils = require("./walletUtils");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const fs = require('fs');
const infuraKey = fs.readFileSync(".infura").toString().trim();
const alchemyKey = fs.readFileSync(".alchemy").toString().trim();
const etherscanKey = fs.readFileSync(".etherscan").toString().trim();
const blockvigilKey = fs.readFileSync(".blockvigil").toString().trim();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  //expand to required versions
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings:{
          evmVersion: "berlin",
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.8.2",
        settings:{
          evmVersion: "berlin",
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.5.2",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.5.16",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.4.24",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.9",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.0",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.7.0",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.7.6",
        settings:{
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.8",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.0",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
    ]
  },
  //solidity: "0.8.4",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    ropsten: {
      //url:`https://ropsten.infura.io/v3/${infuraKey}`,
      url:`https://eth-rinkeby.alchemyapi.io/v2/${alchemyKey}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : walletUtils.makeKeyList(),
    },
    kovan:{
      //url:`https://kovan.infura.io/v3/${infuraKey}`,
      url:`https://eth-kovan.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:42,
    },
    goerli:{
      url:`https://eth-goerli.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:5
    },
    rinkeby:{
      //url:`https://kovan.infura.io/v3/${infuraKey}`,
      url:`https://eth-rinkeby.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:4,
    },
    mumbai:{
      url:`https://polygon-mumbai.g.alchemy.com/v2/7JwWhWSG1vtw6ggm_o_GcYnyNw02oM8b`,
      accounts:walletUtils.makeKeyList(),
      chainId:80001,
      gasPrice: 5000000000
    },
    polygon:{
      url:`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:4,
      gasPrice: 10000000000
    },
    mainnet:{
      url:`https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`,
      accounts:walletUtils.makeKeyList(),
      chainId:1,
    },
    //add more networks here
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: etherscanKey,
  },
};
