// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./BicoTokenImplementation.sol";

contract BicoTokenV2 is BicoTokenImplementation {
   
    /// @notice Address which may mint new tokens
    address public minter;

    /// @notice The timestamp after which minting may occur
    uint public mintingAllowedAfter;

    /// @notice Minimum time between mints
    uint32 public constant minimumTimeBetweenMints = 1 days * 365;

    /// @notice Cap on the percentage of totalSupply that can be minted at each mint
    uint8 public constant mintCap = 2;

    function initialize(address trustedForwarder) public initializer {
        __BicoTokenImplementation_init(trustedForwarder); // Do not forget this call!
        minter = msg.sender;
        mintingAllowedAfter = 0;
    }
    
    function __BicotokenV2_init_(address trustedForwarder) internal initializer {
       __BicoTokenImplementation_init(trustedForwarder);
       minter = msg.sender;
       mintingAllowedAfter = 0;
    }
   
    function __BicotokenV2_init_unchained() internal initializer {
        minter = msg.sender;
        mintingAllowedAfter = 0;
    }
    
    function increaseAllowance(address spender, uint256 addedValue) public virtual override returns (bool) {
        //_approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }
}