// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC20MetaNew.sol";

// File contracts/governance/Governed.sol

pragma solidity ^0.8.0;

/**
 * @title Graph Governance contract
 * @dev All contracts that will be owned by a Governor entity should extend this contract.
 */
contract Governed {
    // -- State --

    address public governor;
    address public pendingGovernor;

    // -- Events --

    event NewPendingOwnership(address indexed from, address indexed to);
    event NewOwnership(address indexed from, address indexed to);

    /**
     * @dev Check if the caller is the governor.
     */
    modifier onlyGovernor {
        require(msg.sender == governor, "Only Governor can call");
        _;
    }

    /**
     * @dev Initialize the governor to the contract caller.
     */
    function _initialize(address _initGovernor) internal {
        governor = _initGovernor;
    }

    /**
     * @dev Admin function to begin change of governor. The `_newGovernor` must call
     * `acceptOwnership` to finalize the transfer.
     * @param _newGovernor Address of new `governor`
     */
    function transferOwnership(address _newGovernor) external onlyGovernor {
        require(_newGovernor != address(0), "Governor must be set");

        address oldPendingGovernor = pendingGovernor;
        pendingGovernor = _newGovernor;

        emit NewPendingOwnership(oldPendingGovernor, pendingGovernor);
    }

    /**
     * @dev Admin function for pending governor to accept role and update governor.
     * This function must called by the pending governor.
     */
    function acceptOwnership() external {
        require(
            pendingGovernor != address(0) && msg.sender == pendingGovernor,
            "Caller must be pending governor"
        );

        address oldGovernor = governor;
        address oldPendingGovernor = pendingGovernor;

        governor = pendingGovernor;
        pendingGovernor = address(0);

        emit NewOwnership(oldGovernor, governor);
        emit NewPendingOwnership(oldPendingGovernor, pendingGovernor);
    }
}

pragma solidity ^0.8.0;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "ECDSA: invalid signature 's' value");
        require(v == 27 || v == 28, "ECDSA: invalid signature 'v' value");

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * replicates the behavior of the
     * https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign[`eth_sign`]
     * JSON-RPC method.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}

contract BiconomyToken is ERC20Meta, Pausable, AccessControl, Governed {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
    );
    bytes32 public constant APPROVE_TYPEHASH = keccak256(
        "Approve(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "Transfer(address sender,address recipient,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    bytes32 private DOMAIN_SEPARATOR;
    /// @notice A record of states for signing / validating signatures
    mapping (address => uint) public nonces;

    constructor(address beneficiary, address trustedForwarder) ERC20Meta("Biconomy Token", "BICO",trustedForwarder) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        Governed._initialize(msg.sender);
        _mint(beneficiary, 1000000000 * 10 ** decimals());

        // EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPE_HASH,
                keccak256("Biconomy Token"),
                keccak256("1"),
                address(this),
                bytes32(getChainId())
            )
        );
    }

    event TrustedForwarderChanged(address indexed truestedForwarder, address indexed actor);

    function _msgSender() internal override(ERC20Meta, Context, ERC2771Context)
      view returns (address) {
       return ERC2771Context._msgSender();
    }

    function _msgData() internal override(ERC20Meta, Context, ERC2771Context)
      view returns (bytes memory) {
       return ERC2771Context._msgData();
    }

    /**
     * @dev Approve token allowance by validating a message signed by the holder.
     * @param _owner Address of the token holder
     * @param _spender Address of the approved spender
     * @param _value Amount of tokens to approve the spender
     * @param _deadline Expiration time of the signed approval
     * @param _v Signature version
     * @param _r Signature r value
     * @param _s Signature s value
     */
    function approveWithSig(
        address _owner,
        address _spender,
        uint256 _value,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        APPROVE_TYPEHASH,
                        _owner,
                        _spender,
                        _value,
                        nonces[_owner],
                        _deadline
                    )
                )
            )
        );
        
        address recoveredAddress = ECDSA.recover(digest, abi.encodePacked(_r, _s, _v));
        require(recoveredAddress != address(0), "BICO:: invalid signature");
        require(_owner == recoveredAddress, "BICO:: invalid approval:Unauthorized");
        require(_deadline == 0 || block.timestamp <= _deadline, "BICO:: expired approval");
        nonces[_owner] = nonces[_owner] + 1;
        _approve(_owner, _spender, _value);
    }

    /**
     * @dev Transfer tokens by validating a message signed by the sender.
     * @param _sender Address of the token sender
     * @param _recipient Address of the token recipient
     * @param _amount Amount of tokens to transfer
     * @param _deadline Expiration time of the signed approval
     * @param _v Signature version
     * @param _r Signature r value
     * @param _s Signature s value
     */
    function transferWithSig(
        address _sender,
        address _recipient,
        uint256 _amount,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        TRANSFER_TYPEHASH,
                        _sender,
                        _recipient,
                        _amount,
                        nonces[_sender],
                        _deadline
                    )
                )
            )
        );
        

        address recoveredAddress = ECDSA.recover(digest, abi.encodePacked(_r, _s, _v));
        require(recoveredAddress != address(0), "BICO:: invalid signature");
        require(_sender == recoveredAddress, "BICO:: invalid transfer:Unauthorized");
        require(_deadline == 0 || block.timestamp <= _deadline, "BICO:: expired transfer");
        nonces[_sender] = nonces[_sender] + 1;
        _transfer(_sender, _recipient, _amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function setTrustedForwarder(address payable _forwarder) external onlyGovernor {
        _trustedForwarder = _forwarder;
        emit TrustedForwarderChanged(_forwarder, msg.sender);
    }

    function getChainId() internal view returns (uint) {
        uint256 chainId;
        assembly { chainId := chainid() }
        return chainId;
    }
}
