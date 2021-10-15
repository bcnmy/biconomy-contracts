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
    let firstHolder;
    let admin;
    let governor;
    let accessControlAdmin;
    let pauser;
    let minter;

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
    ];

    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const PAUSER_ROLE = ethers.utils.id("PAUSER_ROLE");
    const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");


    let trustedForwarderAddressDefault = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E"; // kovan // not EOA

    let domainData;

    let tokenApprovalRequest = [

    ];

    let tokenTransferRequest = [

    ];

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
            admin  // admin address
        );
        await bicoTokenProxy.deployed();

        bicoToInteract = await ethers.getContractAt(
            "contracts/bico-token/bico/BicoTokenImplementation.sol:BicoTokenImplementation",
            bicoTokenProxy.address
        );

        await bicoToInteract.initialize(
            await accounts[0].getAddress(),
            biconomyForwarder.address,  // trusted forwarder for the current network. otherwise use default value
            governor,
            accessControlAdmin,
            pauser,
            minter
        );
    });

    describe("Token storage reads checks", function () {
        it("Should be able to read state variables through view methods as expected values", async function () {
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

    describe("Access Control actions", function () {
        it("Shows up correct admin and address for all roles", async function () {
            //Checks if roles are correctly set to given addresses
            expect(await bicoToInteract.hasRole(DEFAULT_ADMIN_ROLE,accessControlAdmin)).to.equal(true);
            expect(await bicoToInteract.hasRole(PAUSER_ROLE,pauser)).to.equal(true);
            expect(await bicoToInteract.hasRole(MINTER_ROLE,minter)).to.equal(true);
            //Other roles\'s admin is the default admin role
            expect(await bicoToInteract.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
            expect(await bicoToInteract.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
            //Default admin role\'s admin is itself
            expect(await bicoToInteract.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });

        it("Grants new roles", async function () {
            const addr3 = await accounts[3].getAddress();
            const addr4 = await accounts[4].getAddress();

            //Grant pauser role to account 3 : only address with access control default admin role can do this
            await bicoToInteract.connect(accounts[10]).grantRole(PAUSER_ROLE,addr3);
            //Check if address has been granted pauser role 
            expect(await bicoToInteract.hasRole(PAUSER_ROLE,addr3)).to.equal(true);
            //addr3 can pause the contract now
            await bicoToInteract.connect(accounts[3]).pause();
            //transfers can't be done anymore
            await expect(bicoToInteract.transfer(addr4, ethers.BigNumber.from("100000000000000000000"))).to.be.revertedWith("Pausable: paused");
            //checks if previous pauser is still granted role
            expect(await bicoToInteract.hasRole(PAUSER_ROLE,pauser)).to.equal(true);
            //Any of the pausers can unpause then
            await bicoToInteract.connect(accounts[11]).unpause();

            //Transfer
            await bicoToInteract.transfer(addr4, ethers.BigNumber.from("100000000000000000000"));
            expect(await bicoToInteract.balanceOf(addr4)).to.equal(ethers.BigNumber.from("100000000000000000000"));

            //below should work as well? as transfer() returns bool?
            //expect(await bicoToInteract.transfer(addr4, ethers.BigNumber.from("100000000000000000000"))).to.equal(true);
        });

        it("Revoking and renouncing roles", async function () {
            const addr4 = await accounts[4].getAddress();
            const addr5 = await accounts[5].getAddress();
            const addr6 = await accounts[6].getAddress();
            const addr11 = await accounts[11].getAddress();

            //Grant pauser role to account 5 : only address with access control default admin role can do this
            await bicoToInteract.connect(accounts[10]).grantRole(PAUSER_ROLE,addr5);

            //Address 4 renounces their role as pauser
            await bicoToInteract.connect(accounts[4]).renounceRole(PAUSER_ROLE,addr4);

            //Access control admin revokes addr5 from being pauser
            await bicoToInteract.connect(accounts[10]).revokeRole(PAUSER_ROLE,addr5);

            //Original pauser renounces their role as pauser
            await bicoToInteract.connect(accounts[11]).renounceRole(PAUSER_ROLE,pauser);

            //no pauser left
            await expect(bicoToInteract.connect(accounts[11]).pause()).to.be.revertedWith("BICO:: AccessControl: account");

            //Grant pauser role to account 6 : only address with access control default admin role can do this
            await bicoToInteract.connect(accounts[10]).grantRole(PAUSER_ROLE,addr6);

            //addr6 can pause the contract now
            await bicoToInteract.connect(accounts[6]).pause();

            //transfers can't be done anymore
            await expect(bicoToInteract.transfer(addr4, ethers.BigNumber.from("100000000000000000000"))).to.be.revertedWith("Pausable: paused");

            //Grant pauser role to pauser : only address with access control default admin role can do this
            await bicoToInteract.connect(accounts[10]).grantRole(PAUSER_ROLE,pauser);

            //pauser can unpause now
            await bicoToInteract.connect(accounts[11]).unpause();

            //Transfer
            await bicoToInteract.transfer(addr6, ethers.BigNumber.from("100000000000000000000"));
            expect(await bicoToInteract.balanceOf(addr6)).to.equal(ethers.BigNumber.from("100000000000000000000"));

            //Role revoked for addr6
            await bicoToInteract.connect(accounts[10]).revokeRole(PAUSER_ROLE,addr6);
        });

        it("only Governor can set mint config", async function () {
            const newMintCap = 3; //only integer % 
            await bicoToInteract.connect(accounts[9]).setMintCap(newMintCap);
        });

        it("only Governor can set mint config", async function () {
            const mintingAllowedAfter = 1634273009000;  
            await bicoToInteract.connect(accounts[9]).setMintingAllowedAfter(mintingAllowedAfter);
        });

        it("Unauthorized account can not set mint config", async function () {
            const newMinimumTimeBetweenMints = 3650000; 
            await expect(bicoToInteract.setMinimumTimeBetweenMints(newMinimumTimeBetweenMints)).to.be.revertedWith("Only Governor can call");
        });
    });

});