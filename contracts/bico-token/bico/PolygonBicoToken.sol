// File: contracts/child/ChildToken/UpgradeableChildERC20/UChildERC20.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./BicoTokenImplementation.sol";

contract PolygonBicoToken is BicoTokenImplementation {
    string private _revertMsg;
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    modifier only(bytes32 role) {
        require(
            hasRole(role, _msgSender()),
            _revertMsg
        );
        _;
    }

    /**
     * @notice Initialize the contract after it has been proxified
     * @dev meant to be called once immediately after deployment
     */
    function initialize( address beneficiary, address trustedForwarder, address governor, address accessControlAdmin, address pauser, address minter, address childChainManager )
        external
        initializer
    {
        _setupRole(DEPOSITOR_ROLE, childChainManager);
        initialize(beneficiary, trustedForwarder, governor, accessControlAdmin, pauser, minter);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required amount for user
     * Make sure minting is done only by this function
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded amount
     */
    function deposit(address user, bytes calldata depositData)
        external
        // override
        only(DEPOSITOR_ROLE)
    {
        uint256 amount = abi.decode(depositData, (uint256));
        _mint(user, amount);
    }

    /**
     * @notice called when user wants to withdraw tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param amount amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external {
        _burn(_msgSender(), amount);
    }
}