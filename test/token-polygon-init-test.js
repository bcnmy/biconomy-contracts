const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiBN = require('chai-bn');
const { ethers } = require("hardhat");
const {BN} = require('bn.js');
const { defaultAbiCoder } = require('ethers/utils/abi-coder');
const logDecoder = require('../helper/log-decoder.js');

chai
  .use(chaiAsPromised)
  .use(chaiBN(BN))
  .should()

const should = chai.should();

describe("ERC20 :: BICO ", function () {
    let accounts;
    let polyBicoToken;
    let bicoTokenProxy;
    let bicoToInteract;
    let biconomyForwarder;
    let admin;
    let governor;
    let accessControlAdmin;
    let pauser;
    let minter;
    let childChainManager;
    let depositTx;
    let withdrawTx;

    before(async function () {
        accounts = await ethers.getSigners();
        firstHolder = await accounts[0].getAddress();

        admin = await accounts[7].getAddress();
        governor = await accounts[9].getAddress();
        accessControlAdmin = await accounts[10].getAddress();
        pauser = await accounts[11].getAddress();
        minter = await accounts[12].getAddress();
        childChainManager = await accounts[13].getAddress();

        const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
        biconomyForwarder = await Forwarder.deploy(firstHolder);
        await biconomyForwarder.deployed();

        await biconomyForwarder.registerDomainSeparator("BiconomyForwarder", "1");
        console.log("Trusted forwarder deployed and setup:: address: " + biconomyForwarder.address);

        const PolyBicoImplementation = await ethers.getContractFactory("PolygonBicoToken");
        polyBicoToken = await PolyBicoImplementation.deploy();
        await polyBicoToken.deployed();
        console.log("polyBicoToken address" + polyBicoToken.address);

        const BicoProxy = await hre.ethers.getContractFactory("BicoTokenProxy");
        bicoTokenProxy = await BicoProxy.deploy(
            polyBicoToken.address, admin  // admin address
        );
        await bicoTokenProxy.deployed();
        console.log("bicoTokenProxy address" + bicoTokenProxy.address);

        bicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/PolygonBicoToken.sol:PolygonBicoToken",
            bicoTokenProxy.address
        );

        // await bicoToInteract.polygonBico_init(
        //     await accounts[0].getAddress(),
        //     biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
        //     governor,
        //     accessControlAdmin,
        //     pauser,
        //     minter,
        //     childChainManager
        // );
    });

    describe("Polygon Token Actions", function () {
        it("Should be able to mint tokens on deposit", async function () {
            const depositReceiver = "0xcfb14dD525b407e6123EE3C88B7aB20963892a66";
            const depositData = defaultAbiCoder.encode(['uint256'], ["100000000000000000"]);
            
            depositTx = await bicoToInteract.deposit(depositReceiver, depositData);
            should.exist(depositTx);
        });

        // it('Should emit Transfer log', () => {
        //     const logs = logDecoder.decodeLogs(depositTx.receipt.rawLogs);
        //     transferLog = logs.find(l => l.event === 'Transfer');
        //     should.exist(transferLog);
        // });

        it('Should receive withdraw transaction', async() => {
            withdrawTx = await bicoToInteract.withdraw("5000000000000000000");
            should.exist(withdrawTx);
        });
    
        // it('Should emit Transfer transaction', () => {
        //     const logs = logDecoder.decodeLogs(withdrawTx.receipt.rawLogs);
        //     transferLog = logs.find(l => l.event === 'Transfer');
        //     should.exist(transferLog);
        // });
    });
});