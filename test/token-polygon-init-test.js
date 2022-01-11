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

    beforeEach(async function () {
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
    });

    describe("Initialize contract", function () {
        it("Should not mint to zero address", async function () {
            let result = await bicoToInteract.polygonBico_init(
                            "0x0000000000000000000000000000000000000000",
                            biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
                            governor,
                            accessControlAdmin,
                            pauser,
                            minter,
                            childChainManager
                        );
            let totalSupply = await bicoToInteract.totalSupply();
            console.log(totalSupply);

            expect(totalSupply.toString()).to.be.equal("0");
        });

        it("Should be able initialize successfully", async function () {
            let result = await bicoToInteract.polygonBico_init(
                            await accounts[0].getAddress(),
                            biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
                            governor,
                            accessControlAdmin,
                            pauser,
                            minter,
                            childChainManager
                        );

            expect(result).to.be.ok;
        });


        
    });
});