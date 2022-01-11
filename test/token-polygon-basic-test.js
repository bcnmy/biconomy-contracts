const chai = require('chai');
const { expect, expectRevert } = require("chai");
const chaiAsPromised = require('chai-as-promised');
const chaiBN = require('chai-bn');
const { ethers } = require("hardhat");
const {BN} = require('bn.js');
const { defaultAbiCoder } = ethers.utils;
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
    let depositReceiver;

    before(async function () {
        accounts = await ethers.getSigners();
        firstHolder = await accounts[0].getAddress();
        depositReceiver = await accounts[1].getAddress();

        admin = await accounts[7].getAddress();
        governor = await accounts[9].getAddress();
        accessControlAdmin = await accounts[10].getAddress();
        pauser = await accounts[11].getAddress();
        minter = await accounts[12].getAddress();
        childChainManager = await accounts[12].getAddress();

        const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
        biconomyForwarder = await Forwarder.deploy(firstHolder);
        await biconomyForwarder.deployed();

        await biconomyForwarder.registerDomainSeparator("BiconomyForwarder", "1");
        console.log("Trusted forwarder deployed and setup:: address: " + biconomyForwarder.address);

        const PolyBicoImplementation = await ethers.getContractFactory("PolygonBicoToken");
        polyBicoToken = await PolyBicoImplementation.deploy();
        await polyBicoToken.deployed();

        const BicoProxy = await hre.ethers.getContractFactory("BicoTokenProxy");
        bicoTokenProxy = await BicoProxy.deploy(
            polyBicoToken.address, admin  // admin address
        );
        await bicoTokenProxy.deployed();

        bicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/PolygonBicoToken.sol:PolygonBicoToken",
            bicoTokenProxy.address
        );

        await bicoToInteract.polygonBico_init(
            await accounts[0].getAddress(),
            biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
            governor,
            accessControlAdmin,
            pauser,
            minter,
            childChainManager
        );
    });

    describe("Polygon Token Actions", function () {
        it("Should be able to mint tokens on deposit", async function () {
            const depositData = defaultAbiCoder.encode(['uint256'], ["100000000000000000"]);
            let depositTx = await bicoToInteract.connect(accounts[12]).deposit(depositReceiver, depositData);
            let receipt = await ethers.provider.getTransactionReceipt(depositTx.hash);
            receiptLogs = receipt.logs;

            expect(receipt).to.be.ok;
        });

        it('Should emit Transfer log', async function () {
            const depositData = defaultAbiCoder.encode(['uint256'], ["1000000000000000000"]);
            
            let depositTx = await bicoToInteract.connect(accounts[12]).deposit(depositReceiver, depositData);
            let receipt = await ethers.provider.getTransactionReceipt(depositTx.hash);

            expect(receipt.logs).to.be.ok;
        });

        it('Should emit correct value', async () => {
            const depositData = defaultAbiCoder.encode(['uint256'], ["100000000000000000"]);
            let depositTx = await bicoToInteract.connect(accounts[12]).deposit(depositReceiver, depositData);
            let receipt = await ethers.provider.getTransactionReceipt(depositTx.hash);
            expect(receipt.from.toLowerCase()).to.equal(accounts[12].address.toLowerCase());
            expect(receipt.status).to.equal(1);
        });

        it('Tx should revert with proper reason', async() => {
            const depositData = defaultAbiCoder.encode(['uint256'], ["100000000000000000"]);

            await expect(bicoToInteract.connect(accounts[1]).deposit(depositReceiver, depositData)).to.be.reverted;
        })

        // test cases for withdraw method
        it('Should receive withdraw transaction', async () => {
            withdrawTx = await bicoToInteract.connect(accounts[1]).withdraw("100000000000000000");
            let receipt = await ethers.provider.getTransactionReceipt(withdrawTx.hash);
            expect(receipt).to.be.ok
        });
    
        it('Should emit Transfer transaction', async () => {
            withdrawTx = await bicoToInteract.connect(accounts[1]).withdraw("100000000000000000");
            let receipt = await ethers.provider.getTransactionReceipt(withdrawTx.hash);
            expect(receipt.logs).to.be.ok;
        });

        it('Should emit correct value', async () => {
            withdrawTx = await bicoToInteract.connect(accounts[1]).withdraw("100000000000");
            let receipt = await ethers.provider.getTransactionReceipt(withdrawTx.hash);

            expect(receipt.logs).to.be.ok;            
            expect(receipt.from.toLowerCase()).to.equal(accounts[1].address.toLowerCase());
            expect(receipt.status).to.equal(1);
        });
    });
});