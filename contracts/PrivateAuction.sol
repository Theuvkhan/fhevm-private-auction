// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";

/*
--------------------------------------------------------------
PRIVATE SEALED-BID AUCTION (FHE-POWERED)
--------------------------------------------------------------
This version matches the modern fhEVM async-decryption model.
- Encrypted bids stored on-chain
- No on-chain comparisons (not allowed now)
- Winner is computed OFF-CHAIN by decrypting bids (required)
--------------------------------------------------------------
*/

contract PrivateAuction {
    address public owner;
    bool public auctionOpen = true;

    mapping(address => euint64) private encryptedBids;
    mapping(address => bool) private hasBid;

    address[] private bidders;

    constructor() {
        owner = msg.sender;
    }

    // Users submit encrypted bids
    function placeBid(euint64 bid) external {
        require(auctionOpen, "auction closed");

        if (!hasBid[msg.sender]) {
            bidders.push(msg.sender);
            hasBid[msg.sender] = true;
        }

        encryptedBids[msg.sender] = bid;
    }

    // Owner closes the auction
    function closeAuction() external {
        require(msg.sender == owner, "only owner");
        auctionOpen = false;
    }

    // View list of bidders (for off-chain decryption)
    function getBidders() external view returns (address[] memory) {
        return bidders;
    }

    // Owner can read encrypted bids for off-chain processing
    function getEncryptedBid(address bidder) external view returns (euint64) {
        require(msg.sender == owner, "only owner");
        return encryptedBids[bidder];
    }
}
