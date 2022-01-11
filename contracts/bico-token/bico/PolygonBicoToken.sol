// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./BicoTokenImplementation.sol";

contract PolygonBicoToken is Initializable, BicoTokenImplementation {
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    /**
     * @notice Initialize the contract after it has been proxified
     * @dev meant to be called once immediately after deployment
     */
    function polygonBico_init( address beneficiary, address trustedForwarder, address governor, address accessControlAdmin, address pauser, address minter, address childChainManager ) public initializer {
        require(trustedForwarder != address(0), "trustedForwarder address cannot be 0");
        require(governor != address(0), "governor address cannot be 0");
        require(accessControlAdmin != address(0), "accessControlAdmin address cannot be 0");
        require(pauser != address(0), "pauser address cannot be 0");
        require(minter != address(0), "minter address cannot be 0");
        require(childChainManager != address(0), "childChainManager address cannot be 0");

        initialize(beneficiary, trustedForwarder, governor, accessControlAdmin, pauser, minter);
        _setupRole(DEPOSITOR_ROLE, childChainManager);
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
        onlyRole(DEPOSITOR_ROLE)
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