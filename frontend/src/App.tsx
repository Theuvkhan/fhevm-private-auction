import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ---- CONFIG ----

// Local Hardhat node
const RPC_URL = "http://89.58.32.26:8545";

// Paste the address printed by: npx hardhat run scripts/deployLocal.ts --network localhost
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Our contract ABI (euint64 is encoded as bytes for the UI)
const AUCTION_ABI = [
  "function auctionOpen() view returns (bool)",
  "function placeBid(bytes bid) external",
  "function closeAuction() external",
  "function getBidders() view returns (address[])",
  "function getEncryptedBid(address bidder) view returns (bytes)",
];

// ---- helpers to encode/decode bids (same idea as demoAuction.ts) ----

function encodeBid(amount: bigint): Uint8Array {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);
  view.setBigUint64(24, amount); // last 8 bytes
  return new Uint8Array(buf);
}

function decodeBid(hex: string): bigint {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  const bytes = Uint8Array.from(
    hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );
  const slice = bytes.slice(24, 32);
  const view = new DataView(slice.buffer);
  return view.getBigUint64(0);
}

type AuctionHandles = {
  provider: ethers.JsonRpcProvider;
  owner: ethers.Signer;
  bidder: ethers.Signer;
  auctionAsOwner: ethers.Contract;
  auctionAsBidder: ethers.Contract;
};

function App() {
  const [handles, setHandles] = useState<AuctionHandles | null>(null);
  const [status, setStatus] = useState<string>("Connecting to local Hardhat...");
  const [bidInput, setBidInput] = useState<string>("100");
  const [biddersView, setBiddersView] = useState<
    { address: string; decodedBid: string }[]
  >([]);
  const [winner, setWinner] = useState<{ address: string; bid: string } | null>(
    null
  );
  const [auctionOpen, setAuctionOpen] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // connect on mount
  useEffect(() => {
    (async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        // Hardhat local node exposes unlocked accounts.
        const owner = await provider.getSigner(0); // auction owner
        const bidder = await provider.getSigner(1); // demo bidder

        const auctionAsOwner = new ethers.Contract(
          CONTRACT_ADDRESS,
          AUCTION_ABI,
          owner
        );

        const auctionAsBidder = new ethers.Contract(
          CONTRACT_ADDRESS,
          AUCTION_ABI,
          bidder
        );

        const open: boolean = await auctionAsOwner.auctionOpen();

        setHandles({ provider, owner, bidder, auctionAsOwner, auctionAsBidder });
        setAuctionOpen(open);
        setStatus("Connected to local Hardhat node.");
      } catch (e) {
        console.error(e);
        setStatus(
          "Failed to connect. Is Hardhat node running on http://127.0.0.1:8545 and contract deployed?"
        );
      }
    })();
  }, []);

  async function refreshAuctionOpen() {
    if (!handles) return;
    const open: boolean = await handles.auctionAsOwner.auctionOpen();
    setAuctionOpen(open);
  }

  async function placeBid() {
    if (!handles) return;
    try {
      setBusy(true);
      setStatus("Sending bid transaction...");

      const amount = BigInt(bidInput);
      const encoded = encodeBid(amount);

      const tx = await handles.auctionAsBidder.placeBid(encoded);
      await tx.wait();

      setStatus(`Bid of ${amount.toString()} submitted from bidder signer.`);
      await refreshAuctionOpen();
    } catch (e) {
      console.error(e);
      setStatus("Bid failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function closeAuction() {
    if (!handles) return;
    try {
      setBusy(true);
      setStatus("Closing auction...");
      const tx = await handles.auctionAsOwner.closeAuction();
      await tx.wait();
      setStatus("Auction closed.");
      await refreshAuctionOpen();
    } catch (e) {
      console.error(e);
      setStatus("Close failed. Check console.");
    } finally {
      setBusy(false);
    }
  }

  async function fetchAndDecode() {
    if (!handles) return;
    try {
      setBusy(true);
      setStatus("Fetching encrypted bids and decoding off-chain...");

      const bidders: string[] = await handles.auctionAsOwner.getBidders();

      const rows: { address: string; decodedBid: string }[] = [];
      let bestBid = -1n;
      let bestAddr = "";

      for (const addr of bidders) {
        const enc: string = await handles.auctionAsOwner.getEncryptedBid(addr);
        const decoded = decodeBid(enc);
        rows.push({ address: addr, decodedBid: decoded.toString() });

        if (decoded > bestBid) {
          bestBid = decoded;
          bestAddr = addr;
        }
      }

      setBiddersView(rows);
      if (bestBid >= 0n) {
        setWinner({ address: bestAddr, bid: bestBid.toString() });
      } else {
        setWinner(null);
      }

      setStatus("Decoded bids off-chain and computed winner.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to read/ decode bids. Is the auction closed?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "#050816",
        color: "#f9fafb",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "1.5rem",
          borderRadius: "1rem",
          background: "#0b1120",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          border: "1px solid #1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          🔐 Private Sealed-Bid Auction (fhEVM demo)
        </h1>
        <p style={{ marginBottom: "1rem", opacity: 0.85 }}>
          Local-only demo UI. Uses Hardhat’s built-in accounts, no external
          wallet connection.
        </p>

        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: "#111827",
            fontSize: "0.9rem",
          }}
        >
          <div>
            <strong>Status:</strong> {status}
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <strong>Auction:</strong>{" "}
            {CONTRACT_ADDRESS === "0xYourAuctionAddressHere"
              ? "⚠️ Set CONTRACT_ADDRESS in App.tsx"
              : CONTRACT_ADDRESS}
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <strong>Auction open:</strong>{" "}
            {auctionOpen === null
              ? "unknown"
              : auctionOpen
              ? "✅ yes"
              : "❌ no"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1.2fr 1fr",
            alignItems: "flex-start",
          }}
        >
          {/* left column: place bid */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Place bid (demo bidder)
            </h2>
            <label style={{ fontSize: "0.9rem", display: "block" }}>
              Bid amount (uint64, will be encoded as bytes)
            </label>
            <input
              type="number"
              min={0}
              value={bidInput}
              onChange={(e) => setBidInput(e.target.value)}
              style={{
                marginTop: "0.25rem",
                marginBottom: "0.75rem",
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            />

            <button
              disabled={busy || !handles || CONTRACT_ADDRESS === "0xYourAuctionAddressHere"}
              onClick={placeBid}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor:
                  busy || !handles || CONTRACT_ADDRESS === "0xYourAuctionAddressHere"
                    ? "not-allowed"
                    : "pointer",
                background:
                  busy || !handles || CONTRACT_ADDRESS === "0xYourAuctionAddressHere"
                    ? "#4b5563"
                    : "#22c55e",
                color: "#020617",
                fontWeight: 600,
              }}
            >
              {busy ? "Working..." : "Submit bid as bidder[1]"}
            </button>
          </div>

          {/* right column: owner actions */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Owner actions
            </h2>

            <button
              disabled={busy || !handles || !auctionOpen}
              onClick={closeAuction}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                marginBottom: "0.75rem",
                cursor:
                  busy || !handles || !auctionOpen ? "not-allowed" : "pointer",
                background:
                  busy || !handles || !auctionOpen ? "#4b5563" : "#f97316",
                color: "#020617",
                fontWeight: 600,
              }}
            >
              Close auction
            </button>

            <button
              disabled={busy || !handles}
              onClick={fetchAndDecode}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: busy || !handles ? "not-allowed" : "pointer",
                background:
                  busy || !handles ? "#4b5563" : "#38bdf8",
                color: "#020617",
                fontWeight: 600,
              }}
            >
              Fetch & decode all bids (off-chain)
            </button>
          </div>
        </div>

        {/* bidders table */}
        {biddersView.length > 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2937",
              fontSize: "0.9rem",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Decoded bids (off-chain view)
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Bidder
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Decoded bid
                  </th>
                </tr>
              </thead>
              <tbody>
                {biddersView.map((row) => (
                  <tr key={row.address}>
                    <td
                      style={{
                        padding: "0.4rem 0",
                        borderBottom: "1px solid #111827",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                      }}
                    >
                      {row.address}
                    </td>
                    <td
                      style={{
                        padding: "0.4rem 0",
                        borderBottom: "1px solid #111827",
                        textAlign: "right",
                      }}
                    >
                      {row.decodedBid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {winner && (
              <div style={{ marginTop: "0.75rem" }}>
                <strong>Winner:</strong> {winner.address} <br />
                <strong>Highest bid:</strong> {winner.bid}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

