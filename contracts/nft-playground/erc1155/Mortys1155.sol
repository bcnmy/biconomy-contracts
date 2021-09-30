// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Mortys1155 is ERC1155, Ownable {
    constructor() ERC1155("https://docs.biconomy.io/") {}

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}
