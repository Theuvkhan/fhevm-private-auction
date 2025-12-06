import { expect } from "chai";
import { ethers } from "hardhat";

describe("PrivateAuction", function () {
  it("accepts encrypted bids and stores bidders", async function () {
    const [owner, bidder1, bidder2] = await ethers.getSigners();

    // Deploy the contract
    const Auction = await ethers.getContractFactory("PrivateAuction");
    const auction = await Auction.connect(owner).deploy();
    await auction.waitForDeployment();

    // For now, simulate 'encrypted' bids as random bytes.
    // In a real demo, you'd use fhEVM helpers to encrypt the bids.
    const bid1 = ethers.randomBytes(32);
    const bid2 = ethers.randomBytes(32);

    // Place bids
    await auction.connect(bidder1).placeBid(bid1 as any);
    await auction.connect(bidder2).placeBid(bid2 as any);

    // Close auction
    await auction.connect(owner).closeAuction();

    // Get bidders list
    const bidders = await auction.getBidders();
    expect(bidders).to.have.length(2);
    expect(bidders).to.include(bidder1.address);
    expect(bidders).to.include(bidder2.address);
  });
});

