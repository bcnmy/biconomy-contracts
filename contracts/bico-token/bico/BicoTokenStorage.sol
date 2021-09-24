// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

    /// @notice EIP-20 token name for this token
    string public constant _name = "Biconomy Token";

    /// @notice EIP-20 token symbol for this token
    string public constant _symbol = "BICO";

    /// @notice EIP-20 token decimals for this token
    uint8 public constant _decimals = 18;

    /// @notice Total number of tokens in circulation
    uint public _totalSupply = 1000000000 * 10 ** _decimals; // 1 billion BICO

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

    mapping (address => mapping (address => uint256)) internal _allowances;

    mapping (address => uint256) internal _balances;

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