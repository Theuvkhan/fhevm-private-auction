import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const Auction = await ethers.getContractFactory("PrivateAuction");
  const auction = await Auction.connect(owner).deploy();
  await auction.waitForDeployment();

  const address = await auction.getAddress();
  console.log("PrivateAuction deployed to:", address);
  console.log("Owner address:", owner.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
