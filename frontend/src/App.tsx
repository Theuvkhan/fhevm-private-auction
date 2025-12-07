import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ---------------- CONFIG ----------------

// VPS Hardhat RPC
const RPC_URL = "http://89.58.32.26:8545";

// PrivateAuction contract address (latest from your deployment)
const CONTRACT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

// Minimal ABI for UI
const AUCTION_ABI = [
  "function auctionOpen() view returns (bool)",
  "function placeBid(bytes32 bid) external",
  "function closeAuction() external",
  "function getBidders() view returns (address[])",
  "function getEncryptedBid(address bidder) view returns (bytes32)"
];

// Encode uint64 → bytes32 (last 8 bytes) as raw bytes
function encodeBid(amount: bigint): Uint8Array {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);
  view.setBigUint64(24, amount); // last 8 bytes hold the bid
  return new Uint8Array(buf);    // ethers can send this as bytes32
}

export default function App() {
  const [status, setStatus] = useState("Initializing…");
  const [auctionOpen, setAuctionOpen] = useState<boolean | null>(null);
  const [bidAmount, setBidAmount] = useState("100");
  const [decodedBids, setDecodedBids] = useState<any[]>([]);

  // ---------------- LOAD AUCTION STATUS ----------------
  const loadStatus = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AUCTION_ABI, provider);

      const open = await contract.auctionOpen();
      setAuctionOpen(open);

      setStatus("Connected to auction.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect. Hardhat node offline?");
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // ---------------- SUBMIT BID ----------------
  const submitBid = async () => {
    try {
      setStatus("Submitting bid…");

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = await provider.getSigner(1); // bidder demo account

      const contract = new ethers.Contract(CONTRACT_ADDRESS, AUCTION_ABI, signer);

      const encoded = encodeBid(BigInt(bidAmount));
      const tx = await contract.placeBid(encoded);
      await tx.wait();

      setStatus(`Bid ${bidAmount} submitted successfully!`);
    } catch (err) {
      console.error(err);
      setStatus("Bid failed. Check node or contract.");
    }
  };

  // ---------------- CLOSE AUCTION ----------------
  const closeAuction = async () => {
    try {
      setStatus("Closing auction…");

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = await provider.getSigner(0); // owner

      const contract = new ethers.Contract(CONTRACT_ADDRESS, AUCTION_ABI, signer);

      const tx = await contract.closeAuction();
      await tx.wait();

      setStatus("Auction closed.");
      setAuctionOpen(false);
    } catch (err) {
      console.error(err);
      setStatus("Failed to close auction.");
    }
  };

  // ---------------- DECODE RESULTS OFF-CHAIN ----------------
  const fetchAndDecode = async () => {
    try {
      setStatus("Decoding bids off-chain…");

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AUCTION_ABI, provider);

      const bidders: string[] = await contract.getBidders();
      if (!bidders.length) {
        setStatus("No bidders found.");
        return;
      }

      const decoded: any[] = [];

      for (const bidder of bidders) {
        const raw = await contract.getEncryptedBid(bidder); // bytes32 hex string

        if (!raw || raw === "0x") continue;

        const hex = raw.startsWith("0x") ? raw.slice(2) : raw;

        // last 16 hex chars = last 8 bytes = uint64
        const last16 = hex.slice(-16);
        const amount = BigInt("0x" + last16);

        decoded.push({ bidder, amount });
      }

      if (decoded.length === 0) {
        setStatus("Could not decode bids.");
        return;
      }

      // Winner = highest amount
      decoded.sort((a, b) => Number(b.amount - a.amount));
      const winner = decoded[0];

      setDecodedBids(decoded);
      setStatus(
        `Decoded ${decoded.length} bids. Winner: ${winner.bidder.slice(0, 6)}…${winner.bidder.slice(
          -4
        )} with bid ${winner.amount.toString()}.`
      );
    } catch (err) {
      console.error(err);
      setStatus("Failed to fetch/decode bids.");
    }
  };

  // ---------------- UI ----------------
  return (
    <div style={{ background: "black", minHeight: "100vh", color: "white", padding: "20px" }}>
      <h1 style={{ fontSize: "42px", fontWeight: "bold" }}>🔐 Private Sealed-Bid Auction</h1>

      {/* STATUS BOX */}
      <div style={{ background: "#0d0f18", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <p><b>Status:</b> {status}</p>
        <p><b>Contract:</b> {CONTRACT_ADDRESS}</p>
        <p><b>Auction open:</b> {auctionOpen ? "✓ yes" : "X no"}</p>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        
        {/* BID BOX */}
        <div style={{ flex: 1, background: "#0d0f18", padding: "20px", borderRadius: "8px" }}>
          <h2>Place bid (demo mode)</h2>
          <p>Uses Hardhat demo account[1] to submit an encoded bid on-chain.</p>

          <input
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", marginBottom: "10px" }}
          />

          <button
            onClick={submitBid}
            style={{
              width: "100%", padding: "15px",
              background: "#00c853", border: "none",
              borderRadius: "6px", color: "black", fontSize: "18px"
            }}
          >
            Submit bid
          </button>
        </div>

        {/* OWNER CONTROLS */}
        <div style={{ flex: 1, background: "#0d0f18", padding: "20px", borderRadius: "8px" }}>
          <h2>Owner controls</h2>

          <button
            onClick={closeAuction}
            style={{
              width: "100%", padding: "15px",
              background: "#555", border: "none",
              borderRadius: "6px", color: "white", marginBottom: "10px"
            }}
          >
            Close auction (owner[0])
          </button>

          <button
            onClick={fetchAndDecode}
            style={{
              width: "100%", padding: "15px",
              background: "#1e88e5", border: "none",
              borderRadius: "6px", color: "white"
            }}
          >
            Fetch & decode bids (off-chain)
          </button>
        </div>
      </div>

      {/* DECODED RESULTS */}
      <div style={{ marginTop: "30px", background: "#0d0f18", padding: "20px", borderRadius: "8px" }}>
        <h2>Off-chain decoded view</h2>

        {!decodedBids.length && <p>No decoded bids yet.</p>}

        {decodedBids.map((b) => (
          <div key={b.bidder} style={{ padding: "8px 0", borderBottom: "1px solid #333" }}>
            <b>{b.bidder.slice(0, 6)}…{b.bidder.slice(-4)}</b> — Bid: {b.amount.toString()}
          </div>
        ))}
      </div>
    </div>
  );
}
