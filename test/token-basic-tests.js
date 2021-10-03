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
        firstHolder = await accounts[0].getAddress();

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
            const beneficiaryBalance = "1000000000000000000000000000";
            expect(await bicoToInteract.name()).to.equal(name);
            expect(await bicoToInteract.isTrustedForwarder(trustedForwarder)).to.equal(true);
            expect((await bicoToInteract.balanceOf(beneficiary)).toString()).to.equal(beneficiaryBalance);
            expect(await bicoToInteract.totalSupply()).to.equal(beneficiaryBalance);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const addr1 = await accounts[1].getAddress();
            const addr2 = await accounts[2].getAddress();

            // Transfer 50 tokens from beneficiary to addr1
            await bicoToInteract.transfer(addr1, ethers.BigNumber.from("50000000000000000000"));
            expect(await bicoToInteract.balanceOf(addr1)).to.equal(ethers.BigNumber.from("50000000000000000000"));

            // Transfer 50 tokens from addr1 to addr2
            await bicoToInteract.connect(accounts[1]).transfer(addr2, ethers.BigNumber.from("50000000000000000000"));
            expect(await bicoToInteract.balanceOf(addr2)).to.equal(ethers.BigNumber.from("50000000000000000000"));
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const beneficiary = await accounts[0].getAddress();
            const initialOwnerBalance = await bicoToInteract.balanceOf(beneficiary);
            const beneficiaryBalance = "999999950000000000000000000";

            // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
            // `require` will evaluate false and revert the transaction.
            await expect(
                bicoToInteract.connect(accounts[1]).transfer(beneficiary, ethers.BigNumber.from("1000000000000000000"))
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed.
            expect(await bicoToInteract.balanceOf(beneficiary)).to.equal(
                beneficiaryBalance
            );
        });

        it("Should update balances after transfers", async function () {
            const initialOwnerBalance = await bicoToInteract.balanceOf(firstHolder);
            const addr3 = await accounts[3].getAddress();
            const addr4 = await accounts[4].getAddress();
            // Transfer 100 tokens from owner to addr1.
            await bicoToInteract.transfer(addr3, ethers.BigNumber.from("100000000000000000000"));
      
            // Transfer another 50 tokens from owner to addr2.
            await bicoToInteract.transfer(addr4, ethers.BigNumber.from("50000000000000000000"));
      
            // Check balances.
            const finalOwnerBalance = await bicoToInteract.balanceOf(firstHolder);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(ethers.BigNumber.from("150000000000000000000")));
      
            const addr3Balance = await bicoToInteract.balanceOf(addr3);
            expect(addr3Balance).to.equal(ethers.BigNumber.from("100000000000000000000"));
      
            const addr4Balance = await bicoToInteract.balanceOf(addr4);
            expect(addr4Balance).to.equal(ethers.BigNumber.from("50000000000000000000"));
          });
    });

});