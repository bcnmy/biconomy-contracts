// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./libs/AccessProtected.sol";

contract D11Vesting is AccessProtected, Pausable {
    using SafeMath for uint256;
    using Address for address;
    address public tokenAddress;

    struct Claim {
        bool isActive;
        uint256 totalAmount;
        uint256 startTime;
        uint256 endTime;
        uint256 amountClaimed;
    }

    mapping(address => Claim) private claims;

    event ClaimCreated(
        address _creator,
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _startTime,
        uint256 _endTime
    );
    event Claimed(address _beneficiary, uint256 _amount);

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    function createClaim(
        address _beneficiary,
        uint256 _totalAmount,
        uint64 _startTime,
        uint64 _endTime
    ) public onlyAdmin {
        require(!claims[_beneficiary].isActive, "CLAIM_ACTIVE");
        require(_endTime >= _startTime, "INVALID_TIME");
        require(_beneficiary != address(0), "INVALID_ADDRESS");
        require(_totalAmount > 0, "INVALID_AMOUNT");
        require(
            ERC20(tokenAddress).allowance(msg.sender, address(this)) >=
                _totalAmount,
            "INVALID_ALLOWANCE"
        );
        ERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            _totalAmount
        );
        Claim memory newClaim = Claim({
            isActive: true,
            totalAmount: _totalAmount,
            startTime: _startTime,
            endTime: _endTime,
            amountClaimed: 0
        });
        claims[_beneficiary] = newClaim;
        emit ClaimCreated(
            msg.sender,
            _beneficiary,
            _totalAmount,
            _startTime,
            _endTime
        );
    }

    function createBatchClaim(
        address[] memory _beneficiaries,
        uint256[] memory _totalAmounts,
        uint64[] memory _startTimes,
        uint64[] memory _endTimes
    ) external onlyAdmin {
        uint256 length = _beneficiaries.length;
        require(
            _totalAmounts.length == length &&
                _startTimes.length == length &&
                _endTimes.length == length,
            "LENGTH_MISMATCH"
        );
        for (uint256 i; i < length; i++) {
            createClaim(
                _beneficiaries[i],
                _totalAmounts[i],
                _startTimes[i],
                _endTimes[i]
            );
        }
    }

    function getClaim(address beneficiary)
        external
        view
        returns (Claim memory)
    {
        require(beneficiary != address(0), "INVALID_ADDRESS");
        return (claims[beneficiary]);
    }

    function claimableAmount(address beneficiary)
        public
        view
        returns (uint256)
    {
        Claim memory _claim = claims[beneficiary];
        if (block.timestamp < _claim.startTime) return 0;
        if (_claim.amountClaimed == _claim.totalAmount) return 0;
        uint256 currentTimestamp = block.timestamp > _claim.endTime
            ? _claim.endTime
            : block.timestamp;
        uint256 claimPercent = currentTimestamp
            .sub(_claim.startTime)
            .mul(1e18)
            .div(_claim.endTime.sub(_claim.startTime));
        uint256 claimAmount = _claim.totalAmount.mul(claimPercent).div(1e18);
        uint256 unclaimedAmount = claimAmount.sub(_claim.amountClaimed);
        return unclaimedAmount;
    }

    function claim() external whenNotPaused {
        address beneficiary = msg.sender;
        Claim memory _claim = claims[beneficiary];
        require(_claim.isActive, "CLAIM_INACTIVE");
        uint256 unclaimedAmount = claimableAmount(beneficiary);
        ERC20(tokenAddress).transfer(beneficiary, unclaimedAmount);
        _claim.amountClaimed = _claim.amountClaimed + unclaimedAmount;
        if (_claim.amountClaimed == _claim.totalAmount) _claim.isActive = false;
        claims[beneficiary] = _claim;
        emit Claimed(beneficiary, unclaimedAmount);
    }

    function revoke(address beneficiary) external onlyAdmin {
        claims[beneficiary].isActive = false;
    }

    function withdrawTokens(address wallet, uint256 amount) external onlyOwner {
        require(amount > 0, "Nothing to withdraw");
        ERC20(tokenAddress).transfer(wallet, amount);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }
}
