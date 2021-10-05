const { expect } = require("chai");
const { ethers } = require("hardhat");
var abi = require('ethereumjs-abi');
const { inputToConfig } = require("@ethereum-waffle/compiler");

const salt = ethers.BigNumber.from(31337);

describe("ERC20 :: BICO ", function () {
    let accounts;
    let bicoToken;
    let bicoTokenProxy;
    let bicoToInteract;
    let biconomyForwarder;
    let firstHolder;
    let bicoTokenV1; //upgraded contract
    let bicoNada;
    let bicoTokenV0;
    let newBicoToInteract;
    let admin, governor, accessControlAdmin, pauser, minter;

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
    ];

    let domainData;

    before(async function () {
        accounts = await ethers.getSigners();
        firstHolder = await accounts[0].getAddress();

        admin = await accounts[7].getAddress();
        governor = await accounts[9].getAddress();
        accessControlAdmin = await accounts[10].getAddress();
        pauser = await accounts[11].getAddress();
        minter = await accounts[12].getAddress();

        const Forwarder = await ethers.getContractFactory("BiconomyForwarder");
        biconomyForwarder = await Forwarder.deploy(await accounts[0].getAddress());
        await biconomyForwarder.deployed();

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

        const BicoNada = await ethers.getContractFactory("BicoTokenNada");
        bicoNada = await BicoNada.deploy();
        await bicoNada.deployed();        

        const BicoProxy = await hre.ethers.getContractFactory(
            "BicoTokenProxy"
        );
        bicoTokenProxy = await BicoProxy.deploy(
            bicoNada.address,
            await accounts[7].getAddress()  // admin address
        );
        await bicoTokenProxy.deployed();

        const BicoImplementation = await ethers.getContractFactory("BicoTokenImplementation");
        bicoTokenV0 = await BicoImplementation.deploy();
        await bicoTokenV0.deployed();

        bicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/BicoTokenImplementation.sol:BicoTokenImplementation",
            bicoTokenProxy.address
        );

        //Deploying new logic contract
        /*const BicoTokenV1 = await ethers.getContractFactory("BicoTokenV1");
        bicoTokenV1 = await BicoTokenV1.deploy();
        await bicoTokenV1.deployed();

        newBicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/BicoTokenV1.sol:BicoTokenV1",
            bicoTokenProxy.address
        );*/

        
    });

    describe("Token storage reads checks", function () {
        
        it("Upgrades to actual V0 implementation and initializes", async function() {
            const req = await bicoToInteract.populateTransaction.initialize(
                await accounts[0].getAddress(),
                biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
                governor,
                accessControlAdmin,
                pauser,
                minter
            );

            await bicoTokenProxy.connect(accounts[7]).upgradeToAndCall(bicoTokenV0.address,req.data);
            const newImplementation = await bicoTokenProxy.getImplementation();
            expect(newImplementation).to.equal(bicoTokenV0.address);
            
            const name = "Biconomy Token";
            const trustedForwarder = biconomyForwarder.address;
            const beneficiary = await accounts[0].getAddress();
            const beneficiaryBalance = "1000000000000000000000000000";
            expect(await bicoToInteract.name()).to.equal(name);
            expect(await bicoToInteract.isTrustedForwarder(trustedForwarder)).to.equal(true);
            expect((await bicoToInteract.balanceOf(beneficiary)).toString()).to.equal(beneficiaryBalance);
            expect(await bicoToInteract.totalSupply()).to.equal(beneficiaryBalance);
        });

    });

});