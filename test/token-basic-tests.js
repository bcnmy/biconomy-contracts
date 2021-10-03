const { expect } = require("chai");
const { ethers } = require("hardhat");
var abi = require('ethereumjs-abi');

const salt = ethers.BigNumber.from(31337);

describe("ERC20 :: BICO ", function () {
    let accounts;
    let bicoToken;
    let bicoTokenProxy;
    let bicoToInteract;
    let biconomyForwarder;

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
    ];

    let trustedForwarderAddressDefault = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E"; // kovan // not EOA

    let domainData;

    let tokenApprovalRequest = [

    ];

    let tokenTransferRequest = [

    ];

    before(async function () {
        accounts = await ethers.getSigners();

        const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
        biconomyForwarder = await Forwarder.deploy(await accounts[0].getAddress());
        await biconomyForwarder.deployed();


        //TODO
        //Review domain data and domain seperator for biconomy forwarder
        //Review domain data for biconomy token gasless methods and registered domain seperator

        domainData = {
            name: "BiconomyForwarder",
            version: "1",
            verifyingContract: biconomyForwarder.address,
            salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
          };

        await biconomyForwarder.registerDomainSeparator("BiconomyForwarder", "1");
        domainSeparator = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
                [
                    ethers.utils.id(
                        "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
                    ),
                    ethers.utils.id(domainData.name),
                    ethers.utils.id(domainData.version),
                    domainData.verifyingContract,
                    domainData.salt,
                ]
            )
        );

        console.log("Trusted forwarder deployed and setup:: address: " + biconomyForwarder.address);

        const BicoImplementation = await ethers.getContractFactory("BicoTokenImplementation");
        bicoToken = await BicoImplementation.deploy();
        await bicoToken.deployed();

        const BicoProxy = await hre.ethers.getContractFactory(
            "BicoTokenProxy"
        );
        bicoTokenProxy = await BicoProxy.deploy(
            bicoToken.address,
            await accounts[7].getAddress()  // admin address
        );
        await bicoTokenProxy.deployed();

        bicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/BicoTokenImplementation.sol:BicoTokenImplementation",
            bicoTokenProxy.address
        );

        await bicoToInteract.initialize(
            await accounts[0].getAddress(),
            biconomyForwarder.address  // trusted forwarder for the current network. otherwise use default value
        );
    });

    describe("Token storage reads checks", function () {
        it("Should be able to read state variables through view mothods as expected values", async function () {
            const name = "Biconomy Token";
            const trustedForwarder = biconomyForwarder.address;
            const beneficiary = await accounts[0].getAddress();
            expect(await bicoToInteract.name()).to.equal(name);
            expect(await bicoToInteract.isTrustedForwarder(trustedForwarder)).to.equal(true);
            console.log(await bicoToInteract.balanceOf(beneficiary));
        });
    });

});