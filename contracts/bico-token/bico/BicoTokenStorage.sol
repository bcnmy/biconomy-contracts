// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//TODO
//review visibility of storage variables
contract BicoTokenStorage {
    // -- State ERC2771 Context--
    address internal _trustedForwarder;

    // -- State Pausable--
    bool internal _paused;   

    // -- State Access Control--
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }
    mapping(bytes32 => RoleData) internal _roles;
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;
    
    // -- State Governed--
    address public governor;
    address public pendingGovernor;

    // -- State Bico Token--

    mapping(address => uint256) internal _balances;

    mapping(address => mapping(address => uint256)) internal _allowances;

    uint256 internal _totalSupply;

    string internal _name;
    string internal _symbol;

    /*
    /// @notice Address which may mint new tokens
    address public minter;

    /// @notice The timestamp after which minting may occur
    uint public mintingAllowedAfter;

    /// @notice Minimum time between mints
    uint32 public constant minimumTimeBetweenMints = 1 days * 365;

    /// @notice Cap on the percentage of totalSupply that can be minted at each mint
    uint8 public constant mintCap = 2;
    */

    /*
    /// @notice An event thats emitted when the minter address is changed
    event MinterChanged(address minter, address newMinter);
    */

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
    );
    bytes32 public constant APPROVE_TYPEHASH = keccak256(
        "Approve(address owner,address spender,uint256 value,uint256 batchId,uint256 batchNonce,uint256 deadline)"
    );
    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "Transfer(address sender,address recipient,uint256 amount,uint256 batchId,uint256 batchNonce,uint256 deadline)"
    );
    bytes32 internal DOMAIN_SEPARATOR;
    /// @notice A record of states for signing / validating signatures
    mapping(address => mapping(uint256 => uint256)) public nonces;



}