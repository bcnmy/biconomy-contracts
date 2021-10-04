const { expect } = require("chai");
const { ethers } = require("hardhat");
var abi = require('ethereumjs-abi');
const { getSignatureParameters } = require("./helpers/eip712Helpers");

const salt = ethers.BigNumber.from(31337);

describe("ERC20 :: BICO ", function () {
    let accounts;
    let bicoToken;
    let bicoTokenProxy;
    let bicoToInteract;
    let biconomyForwarder;
    let firstHolder;
    const zero_address = "0x0000000000000000000000000000000000000000";

    let domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
    ];

    let trustedForwarderAddressDefault = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E"; // kovan // not EOA

    let domainData;
    let tokenDomainData;

    let Approve = [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "batchId", type: "uint256" },
        { name: "batchNonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ];

    let Transfer = [
        { name: "sender", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "batchId", type: "uint256" },
        { name: "batchNonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ];

    let ERC20ForwardRequest = [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "token", type: "address" },
        { name: "txGas", type: "uint256" },
        { name: "tokenGasPrice", type: "uint256" },
        { name: "batchId", type: "uint256" },
        { name: "batchNonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "data", type: "bytes" },
      ];

    before(async function () {
        accounts = await ethers.getSigners();
        firstHolder = await accounts[0].getAddress();

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

        tokenDomainData = {
            name: "Biconomy Token",
            version: "1",
            verifyingContract: bicoToInteract.address,
            salt: ethers.utils.hexZeroPad(salt.toHexString(), 32)
        };
    });

    describe("Gasless Actions", function () {
        it("Should transfer tokens given signature", async function () {
            const initialOwnerBalance = await bicoToInteract.balanceOf(firstHolder);
            const chainId = accounts[0].provider._network.chainId;
            console.log("chain id: " + chainId);
            const addr1 = await accounts[1].getAddress();
            const addr2 = await accounts[2].getAddress();

            const batchId = 0;
            const batchNonce = await bicoToInteract.nonces(firstHolder, batchId);
            const amount = ethers.BigNumber.from("10000000000000000000");
            const deadline = 0;

            let req = {};
            req.sender = firstHolder;
            req.recipient = addr1;
            req.amount = amount.toString();
            req.batchId = batchId;
            req.batchNonce = batchNonce;
            req.deadline = deadline;

            const types = { Transfer };

            const signature = await accounts[0]._signTypedData(tokenDomainData, types, req);
            const { v, r, s } = getSignatureParameters(signature);

            // Transfer 10 tokens from beneficiary to addr1 using signature
            await bicoToInteract.connect(accounts[2]).transferWithSig(v, r, s, deadline, firstHolder, batchId, addr1, amount.toString());

            const finalOwnerBalance = await bicoToInteract.balanceOf(firstHolder);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(amount));
        });

        it("Should approve tokens given signature", async function () {
            const addr3 = await accounts[3].getAddress();
            const addr4 = await accounts[4].getAddress();
            const initialAllowance = await bicoToInteract.allowance(firstHolder,addr3);
            const chainId = accounts[0].provider._network.chainId;
            console.log("chain id: " + chainId);

            const batchId = 0;
            const batchNonce = await bicoToInteract.nonces(firstHolder, batchId);
            const amount = ethers.BigNumber.from("50000000000000000000");
            const deadline = 0;

            let req = {};
            req.owner = firstHolder;
            req.spender = addr3;
            req.value = amount.toString();
            req.batchId = batchId;
            req.batchNonce = batchNonce;
            req.deadline = deadline;

            const types = { Approve };

            const signature = await accounts[0]._signTypedData(tokenDomainData, types, req);
            const { v, r, s } = getSignatureParameters(signature);

            // Approve 10 tokens from beneficiary to addr3 using signature
            await bicoToInteract.connect(accounts[5]).approveWithSig(v, r, s, deadline, firstHolder, batchId, addr3, amount.toString());

            const finalAllowance = await bicoToInteract.allowance(firstHolder,addr3);
            expect(finalAllowance).to.equal(initialAllowance.add(amount));

            await bicoToInteract.connect(accounts[3]).transferFrom(firstHolder,addr4,amount);
            console.log("Allowance used to transfer tokens to addr4 from the owner");
        });

        describe("Personal Sign - Trusted Forwarder", function () {
            it("Transfer BICO : Executes call successfully", async function () {
                const addr5 = await accounts[5].getAddress();
                const amount = ethers.BigNumber.from("50000000000000000000");
                const req = await bicoToInteract.populateTransaction.transfer(addr5, amount.toString());
                const batchId = 0;
                const batchNonce = await biconomyForwarder.getNonce(firstHolder, batchId);
                req.from = firstHolder;
                req.batchId = batchId;
                req.batchNonce = batchNonce.toNumber();
                req.batchId = batchId;
                req.txGas = req.gasLimit.toNumber();
                req.tokenGasPrice = 0;
                req.deadline = 0;
                req.token = zero_address;
                delete req.gasPrice;
                delete req.gasLimit;
                delete req.chainId;

                const hashToSign = abi.soliditySHA3(
                    [
                      "address",
                      "address",
                      "address",
                      "uint256",
                      "uint256",
                      "uint256",
                      "uint256",
                      "uint256",
                      "bytes32",
                    ],
                    [
                      req.from,
                      req.to,
                      req.token,
                      req.txGas,
                      req.tokenGasPrice,
                      req.batchId,
                      req.batchNonce,
                      req.deadline,
                      ethers.utils.keccak256(req.data),
                    ]
                  );

                const sig = await accounts[0].signMessage(hashToSign);
                const tx = await biconomyForwarder.executePersonalSign(req, sig);
                const receipt = await tx.wait(confirmations = 1);
                console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            });

            it("Approve BICO : Executes call successfully", async function () {
                const addr5 = await accounts[5].getAddress();
                const amount = ethers.BigNumber.from("50000000000000000000");
                const req = await bicoToInteract.populateTransaction.approve(addr5, amount.toString());
                const batchId = 0;
                const batchNonce = await biconomyForwarder.getNonce(firstHolder, batchId);
                req.from = firstHolder;
                req.batchId = batchId;
                req.batchNonce = batchNonce.toNumber();
                req.batchId = batchId;
                req.txGas = req.gasLimit.toNumber();
                req.tokenGasPrice = 0;
                req.deadline = 0;
                req.token = zero_address;
                delete req.gasPrice;
                delete req.gasLimit;
                delete req.chainId;

                const hashToSign = abi.soliditySHA3(
                    [
                      "address",
                      "address",
                      "address",
                      "uint256",
                      "uint256",
                      "uint256",
                      "uint256",
                      "uint256",
                      "bytes32",
                    ],
                    [
                      req.from,
                      req.to,
                      req.token,
                      req.txGas,
                      req.tokenGasPrice,
                      req.batchId,
                      req.batchNonce,
                      req.deadline,
                      ethers.utils.keccak256(req.data),
                    ]
                  );

                const sig = await accounts[0].signMessage(hashToSign);
                const tx = await biconomyForwarder.executePersonalSign(req, sig);
                const receipt = await tx.wait(confirmations = 1);
                console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            });
        });

        describe("EIP712 Sign - Trusted Forwarder", function () {
            it("Transfer BICO : Executes call successfully", async function () {
                const addr5 = await accounts[5].getAddress();
                const amount = ethers.BigNumber.from("50000000000000000000");
                const req = await bicoToInteract.populateTransaction.transfer(addr5, amount.toString());
                const batchId = 0;
                const batchNonce = await biconomyForwarder.getNonce(firstHolder, batchId);
                req.from = firstHolder;
                req.batchId = batchId;
                req.batchNonce = batchNonce.toNumber();
                req.batchId = batchId;
                req.txGas = req.gasLimit.toNumber();
                req.tokenGasPrice = 0;
                req.deadline = 0;
                req.token = zero_address;
                delete req.gasPrice;
                delete req.gasLimit;
                delete req.chainId;

                const types = { ERC20ForwardRequest };
                const signature = await accounts[0]._signTypedData(domainData, types, req);

                const tx = await biconomyForwarder.executeEIP712(req, domainSeparator, signature);
                const receipt = await tx.wait(confirmations = 1);
                console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            });

            it("Approve BICO : Executes call successfully", async function () {
                const addr5 = await accounts[5].getAddress();
                const amount = ethers.BigNumber.from("50000000000000000000");
                const req = await bicoToInteract.populateTransaction.approve(addr5, amount.toString());
                const batchId = 0;
                const batchNonce = await biconomyForwarder.getNonce(firstHolder, batchId);
                req.from = firstHolder;
                req.batchId = batchId;
                req.batchNonce = batchNonce.toNumber();
                req.batchId = batchId;
                req.txGas = req.gasLimit.toNumber();
                req.tokenGasPrice = 0;
                req.deadline = 0;
                req.token = zero_address;
                delete req.gasPrice;
                delete req.gasLimit;
                delete req.chainId;

                const types = { ERC20ForwardRequest };
                const signature = await accounts[0]._signTypedData(domainData, types, req);
                
                const tx = await biconomyForwarder.executeEIP712(req, domainSeparator, signature);
                const receipt = await tx.wait(confirmations = 1);
                console.log(`gas used from receipt ${receipt.gasUsed.toNumber()}`);
            });

            it("Updates nonces", async function () {
                expect(
                  await biconomyForwarder.getNonce(await accounts[0].getAddress(), 0)
                ).to.equal(4);
              });
        });
    });
});