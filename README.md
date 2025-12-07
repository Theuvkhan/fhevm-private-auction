Private Sealed-Bid Auction (FHEVM-Inspired Demo)
Hardhat • React • Off-Chain Decryption

On-chain bids are stored as encrypted blobs. This project demonstrates the core workflow of Zama’s FHEVM using a simplified encrypted format (bytes32) suitable for a builder-track project.

It is designed for competition judges to clearly understand:

how encrypted values travel through a blockchain system

why FHE is necessary

how a private auction works from end to end

how a real FHEVM workflow would look

This is NOT a full cryptographic implementation — it is a structurally accurate prototype.

⭐ Why This Project Exists

Zama’s FHEVM allows encrypted values (euint64) to be stored, compared, and processed without revealing them.

However, full FHE ciphertext computation is too heavy for a small builder demo.

So this project implements:

A structurally accurate, end-to-end confidential auction

Using bytes32 as a mock encrypted bid

And replicates the intended FHE workflow:

```Bidder → Encrypted Bid → On-Chain Storage → Auction Close → Off-Chain Decryption → Winner Reveal

```
This allows a complete demonstration without running a full FHE worker network.

🚀 Features

✔ Private sealed-bid flow — bids hidden until auction closes

✔ Encrypted bid storage using bytes32

✔ Off-chain decryption to reveal winner

✔ Owner / public modes

✔ Zama-inspired UI theme

✔ Supports redeploying new auctions anytime

🏗 Architecture

``` +---------------------------+
| React Frontend (Vite)     |
| - Submit bids             |
| - Close auction (owner)   |
| - Decode winner           |
+-------------+-------------+
              |
              v
+---------------------------+
| Hardhat Node (Localhost) |
| Smart Contract:           |
|  - placeBid(bytes32)      |
|  - closeAuction()         |
|  - getEncryptedBid()      |
+-------------+-------------+
              |
              v
+---------------------------+
| Off-Chain Decoder Script  |
| - Reads bytes32 values    |
| - Extracts uint64 values  |
| - Computes winner         |
+---------------------------+
 ```
📦 Smart Contract Overview
Functions:

``` function placeBid(bytes32 bid) external;
function closeAuction() external;
function getBidders() view returns (address[]);
function getEncryptedBid(address bidder) view returns (bytes32);
function auctionOpen() view returns (bool);
 ```
Workflow:

Users submit encrypted bids

Contract stores them

Owner closes auction

Off-chain logic decrypts and reveals winner

🛠 Local Setup

1️⃣ Start Hardhat node (background)

``` cd ~/fhevm-private-auction
tmux new -s hardhat
npx hardhat node
 ```
``` Ctrl + B, then D
 ```

2️⃣ Deploy new contract

``` cd ~/fhevm-private-auction
npx hardhat run scripts/deployLocal.ts --network localhost
 ```
You will see:
``` PrivateAuction deployed to: 0xABC...
Owner address: 0x123...
 ```
Copy the contract address.

3️⃣ Update frontend contract address

``` cd ~/fhevm-private-auction/frontend/src
nano App.tsx
 ```
Find:
``` const CONTRACT_ADDRESS = "0x...";
 ```
Paste the new address.
Save:
``` Ctrl + O
Enter
Ctrl + X
 ```

4️⃣ Start frontend (background)
``` cd ~/fhevm-private-auction/frontend
tmux new -s auction
npm run dev -- --host 0.0.0.0 --port 5173
 ```
Detach again:
``` Ctrl + B, then D
 ```
🧪 Running Tests
``` npx hardhat test
 ```

▶ How to Use the App
Public User

Enter numeric bid

Bid stored on-chain as bytes32 encrypted blob

Cannot close auction

Owner

Can close auction

After closing, can fetch & decode results

UI shows:
``` Bidder  → Decoded Amount  
Winner → Highest Bid  
 ```

🔄 Redeploying a New Auction (important!)

Every time you deploy a new contract:

Run deploy script

Copy new address

Update frontend → App.tsx → CONTRACT_ADDRESS

Restart frontend tmux session:
``` tmux attach -t auction
Ctrl + C
npm run dev -- --host 0.0.0.0 --port 5173
 ```
 
🔬 How Encryption Is Simulated

Real FHE ciphertexts are large and computed server-side.

This demo uses:
``` bytes32 mockCipher
 ```
Where:

The last 8 bytes hold the numeric bid

The rest simulate ciphertext padding

Off-chain logic extracts the final uint64

This mimics the real FHE workflow while staying lightweight.

📌 Limitations (Honest for Judges)

No real cryptography (uses bytes32 mock)

No real euint64 computation

Off-chain decode instead of FHE-oracle decrypt

Frontend uses Hardhat accounts

These limitations are transparent and expected for a builder-track submission.

🎯 Future Improvements

Full euint64 support via Zama FHEVM

Automatic bidding from real wallets

On-chain encrypted max() comparison

Dedicated FHE decryption worker

👤 Author

This project demonstrates understanding of:

Confidential smart contract design

FHE workflows

Encrypted bid handling

Off-chain secure computation

Frontend ↔ blockchain architecture

✅ END OF README
