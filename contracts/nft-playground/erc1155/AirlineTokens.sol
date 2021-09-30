// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
 
contract AirlineTokens is ERC1155 {
  address public governance;
  uint256 public airlineCount;	
  modifier onlyGovernance() {
    	require(msg.sender == governance, "only governance can call this");    	
    	_;
  }
 
  constructor() ERC1155("") {
    	governance = msg.sender;
    	airlineCount = 0;
  }
  
  function addNewAirline(uint256 initialSupply) external onlyGovernance {
    	airlineCount++;
    	uint256 airlineTokenClassId = airlineCount; 
    	_mint(msg.sender, airlineTokenClassId, initialSupply, "");    	
  }
}