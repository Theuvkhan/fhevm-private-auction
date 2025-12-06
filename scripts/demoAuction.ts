import { ethers } from "hardhat";

// Encode a numeric bid into 32 bytes (simulating an "encrypted" payload)
function encodeBid(amount: bigint): Uint8Array {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);
  // store the amount in the last 8 bytes (big-endian)
  view.setBigUint64(24, amount);
  return new Uint8Array(buf);
}

// Decode the last 8 bytes of a 32-byte hex string back into a bigint
function decodeBid(hex: string): bigint {
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  const bytes = Uint8Array.from(
    hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );

  const buf = bytes.buffer.slice(24, 32); // last 8 bytes
  const view = new DataView(buf);
  return view.getBigUint64(0);
}

async function main() {
  const [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

  console.log("Owner:   ", owner.address);
  console.log("Bidder 1:", bidder1.address);
  console.log("Bidder 2:", bidder2.address);
  console.log("Bidder 3:", bidder3.address);

  const Auction = await ethers.getContractFactory("PrivateAuction");
  const auction = await Auction.connect(owner).deploy();
  await auction.waitForDeployment();

  console.log("PrivateAuction deployed at:", await auction.getAddress());

  // Example bids (these would be encrypted in a real FHE setup)
  const bid1 = 100n;
  const bid2 = 250n;
  const bid3 = 180n;

  // Encode them into 32-byte payloads (simulated ciphertexts)
  const enc1 = encodeBid(bid1);
  const enc2 = encodeBid(bid2);
  const enc3 = encodeBid(bid3);

  console.log("\nSubmitting bids (simulated encrypted bytes)...");
  await (await auction.connect(bidder1).placeBid(enc1 as any)).wait();
  await (await auction.connect(bidder2).placeBid(enc2 as any)).wait();
  await (await auction.connect(bidder3).placeBid(enc3 as any)).wait();

  console.log("Bids submitted.");

  console.log("\nClosing auction...");
  await (await auction.connect(owner).closeAuction()).wait();
  console.log("Auction closed.");

  console.log("\nFetching bidders from contract...");
  const bidders: string[] = await auction.getBidders();
  console.log("Bidders:", bidders);

  // OFF-CHAIN "DECRYPTION" + WINNER SELECTION
  let highestBid = -1n;
  let winner: string | null = null;

  console.log("\nReading encrypted bids and decoding locally...");

  for (const addr of bidders) {
    const encBidHex: string = (await auction.getEncryptedBid(addr)) as any;
    const decoded = decodeBid(encBidHex);

    console.log(`- Bidder ${addr} -> decoded bid: ${decoded}`);

    if (decoded > highestBid) {
      highestBid = decoded;
      winner = addr;
    }
  }

  console.log("\n===== AUCTION RESULT (OFF-CHAIN) =====");
  console.log("Winner address:", winner);
  console.log("Highest bid:   ", highestBid.toString());
  console.log("======================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
