import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ------------ CONFIG ------------

// VPS Hardhat RPC
const RPC_URL = "http://89.58.32.26:8545";

// Deployed PrivateAuction contract
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

// Minimal ABI for the UI
const AUCTION_ABI = [
  "function auctionOpen() view returns (bool)",
  "function placeBid(bytes bid) external",
  "function closeAuction() external",
  "function getBidders() view returns (address[])",
  "function getEncryptedBid(address bidder) view returns (bytes)",
];

// Encode uint64 into 32 bytes (simulated encrypted payload)
function encodeBid(amount: bigint): Uint8Array {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);
  view.setBigUint64(24, amount); // last 8 bytes
  return new Uint8Array(buf);
}

// Narrowed contract type so TS knows our functions
type AuctionContract = ethers.Contract & {
  auctionOpen: () => Promise<boolean>;
  placeBid: (bid: Uint8Array) => Promise<ethers.TransactionResponse>;
};

export default function App() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<AuctionContract | null>(null);

  const [status, setStatus] = useState("Connecting to public auction view…");
  const [auctionOpen, setAuctionOpen] = useState<boolean | null>(null);

  const [bidAmount, setBidAmount] = useState("100");
  const [busy, setBusy] = useState(false);

  // ---- connect to RPC + contract ----
  useEffect(() => {
    async function init() {
      try {
        const p = new ethers.JsonRpcProvider(RPC_URL);
        await p.getBlockNumber(); // connectivity test

        const c = new ethers.Contract(
          CONTRACT_ADDRESS,
          AUCTION_ABI,
          p
        ) as AuctionContract;

        setProvider(p);
        setContract(c);

        try {
          const open = await c.auctionOpen();
          setAuctionOpen(open);
        } catch {
          setAuctionOpen(null);
        }

        setStatus("Connected to public auction view.");
      } catch (err) {
        console.error(err);
        setStatus("Public view loaded. Node might be offline.");
        setAuctionOpen(null);
      }
    }

    init();
  }, []);

  // ---- submit bid (real tx via Hardhat demo account[1]) ----
  async function submitBid() {
    if (!provider || !contract) {
      setStatus("Cannot submit – backend node unavailable.");
      return;
    }
    if (!bidAmount) return;

    setBusy(true);
    try {
      const amt = BigInt(bidAmount);
      const encoded = encodeBid(amt);

      // Hardhat built-in account[1] as demo bidder
      const signer1 = await provider.getSigner(1);
      const writable = contract.connect(signer1) as AuctionContract;

      const tx = await writable.placeBid(encoded);
      setStatus("Sending bid transaction…");
      await tx.wait();

      setStatus(`Bid ${amt.toString()} placed on-chain from demo account[1].`);
    } catch (err) {
      console.error(err);
      setStatus("Bid failed. Check node or contract.");
    } finally {
      setBusy(false);
    }
  }

  // ---- disabled owner / fetch actions in public view ----
  function handleOwnerDisabled() {
    setStatus("Owner-only actions are disabled in this public demo.");
  }

  function handleFetchDisabled() {
    setStatus("Off-chain decryption is disabled in public demo. Use local full version.");
  }

  // IMPORTANT: do NOT depend on auctionOpen for enabling the button
  const canSubmitBid = !!provider && !!contract && !busy;

  // ------------- UI -------------
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "#000",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {/* Top yellow bar */}
      <div
        style={{
          background: "#f5c518",
          padding: "16px 28px",
          fontWeight: "bold",
          fontSize: "18px",
          color: "#000",
        }}
      >
        ZAMA • PRIVATE AUCTION DEMO
        <button
          style={{
            float: "right",
            background: "#000",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: "20px",
            border: "none",
            fontWeight: "bold",
            cursor: "default",
          }}
        >
          READ-ONLY PUBLIC VIEW
        </button>
      </div>

      {/* Main content wrapper */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px 48px",
        }}
      >
        <h1 style={{ fontSize: "40px", marginBottom: "8px", fontWeight: 800 }}>
          🔐 Private Sealed-Bid Auction
        </h1>

        <p style={{ maxWidth: "900px", color: "#d4d4d4" }}>
          On-chain bids are stored as encrypted blobs. This public interface
          sends bids using a built-in demo account and keeps owner actions
          disabled, so the auction state stays stable for viewers.
        </p>

        {/* Status card */}
        <div
          style={{
            background: "#0d1117",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "24px",
            marginBottom: "28px",
          }}
        >
          <div>
            <strong>Status:</strong> {status}
          </div>
          <div>
            <strong>Contract:</strong> {CONTRACT_ADDRESS}
          </div>
          <div>
            <strong>Auction open:</strong>{" "}
            {auctionOpen === null ? "…" : auctionOpen ? "✓ yes" : "✗ no"}
          </div>
          <p style={{ marginTop: "8px", color: "#9ca3af", fontSize: "0.9rem" }}>
            Public demo – no wallet connection required. Owner-only operations
            and FHE decryption flow are available in the local developer
            version.
          </p>
        </div>

        {/* Grid: bid + owner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "28px",
          }}
        >
          {/* Bid panel */}
          <div
            style={{
              background: "#0d1117",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <h2>Place bid (demo mode)</h2>
            <p style={{ color: "#9ca3af" }}>
              Uses Hardhat demo account[1] to submit an encoded bid amount
              on-chain.
            </p>

            <label style={{ fontSize: "0.9rem" }}>Bid amount (uint64)</label>
            <input
              type="number"
              min={0}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#111827",
                color: "#f9fafb",
              }}
            />

            <button
              disabled={!canSubmitBid}
              onClick={submitBid}
              style={{
                marginTop: "14px",
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                background: canSubmitBid ? "#22c55e" : "#374151",
                color: "#000",
                cursor: canSubmitBid ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "Submitting…" : "Submit bid"}
            </button>
          </div>

          {/* Owner panel */}
          <div
            style={{
              background: "#0d1117",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <h2>Owner controls</h2>
            <p style={{ color: "#9ca3af" }}>
              In the local version, the auction owner can close the auction and
              run the FHE decryption flow. In this public demo these actions are
              intentionally disabled.
            </p>

            <button
              onClick={handleOwnerDisabled}
              disabled
              style={{
                width: "100%",
                padding: "12px 14px",
                marginTop: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#1f2933",
                color: "#9ca3af",
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              Owner-only (local demo)
            </button>

            <button
              onClick={handleFetchDisabled}
              disabled
              style={{
                width: "100%",
                padding: "12px 14px",
                marginTop: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#1c4d7f",
                color: "#d1d5db",
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              Disabled in public demo mode
            </button>
          </div>
        </div>

        {/* Off-chain decoded view placeholder */}
        <div
          style={{
            marginTop: "32px",
            background: "#0d1117",
            padding: "24px",
            borderRadius: "12px",
          }}
        >
          <h2>Off-chain decoded view</h2>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            In the full fhEVM developer setup, this section would display
            decrypted bids and the computed winner using the FHE oracle. For the
            public demo, decryption is intentionally disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
