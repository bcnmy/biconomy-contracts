// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./BicoTokenImplementation.sol";

contract BicoTokenV1 is BicoTokenImplementation {
   
    bool internal _initializedV1;

    function initializeV1() external{
        require(!_initializedV1, "BicoTokenV1: contract is already initialized");
        require(_initializedVersion == 0, "BicoTokenV1: version 0 must be initialized");
        //__BicoTokenImplementation_init(trustedForwarder); // forget this call!
        _initializedV1 = true;
        _initializedVersion = 1;
    }
    
    function increaseAllowance(address spender, uint256 addedValue) public virtual override returns (bool) {
        //_approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }
}