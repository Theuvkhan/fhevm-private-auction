🚀 Private Sealed-Bid Auction (fhEVM • Fully Homomorphic Encryption)

A privacy-preserving sealed-bid auction built using Zama’s fhEVM, where all bids remain encrypted on-chain.
The smart contract never sees plaintext bid values — privacy is preserved end-to-end.

This project is an end-to-end demonstration for the Zama Builder Track.

🔒 Why FHE for Auctions?

Traditional blockchain auctions reveal every bid publicly.
Using Fully Homomorphic Encryption (FHE):

No one can see individual bid values

Bids remain fully confidential

Winner computation happens off-chain using FHE decryption helpers

Only the final winner is revealed

Losing bids remain private forever

This enables a true private sealed-bid auction.

📁 Project Overview
contracts/
 └── PrivateAuction.sol
test/
 └── PrivateAuction.test.ts
scripts/
 └── demoAuction.ts
README.md

🧱 Smart Contract Architecture
✔ Encrypted bid submission

Users submit an encrypted euint64. The contract stores ciphertext directly on-chain.

✔ No on-chain decryption

fhEVM uses asynchronous off-chain decryption, meaning the contract never decrypts values.

✔ Owner-controlled auction closing

Once closed, no more bids may be placed.

✔ Export bidders + encrypted bids

Used for the off-chain decryption step.

🔧 How the System Works (End-to-End)
1️⃣ User encrypts bid off-chain

(For this demo, encryption is simulated with 32-byte payloads)

2️⃣ User submits encrypted bid
placeBid(euint64 encryptedBid)

3️⃣ Owner closes the auction
closeAuction()

4️⃣ Owner fetches encrypted bids
const bidders = await auction.getBidders();
const encrypted = await auction.getEncryptedBid(bidder);

5️⃣ FHE Oracle decrypts off-chain

Real FHEVM uses an off-chain oracle to decrypt values privately.

6️⃣ Winner is computed locally

Only the winner may be published.

🧪 Testing

Run:

npx hardhat test


Tests cover:

deployment

encrypted bid submission

bidder tracking

auction closing

Test file:
test/PrivateAuction.test.ts

🔁 Full Demo Script (Deploy → Bid → Close → Decrypt → Winner)

Run:

npx hardhat run scripts/demoAuction.ts


The script:

Deploys the contract

Submits 3 encrypted (simulated) bids

Closes the auction

Fetches encrypted bids

Decodes them off-chain

Prints the winner

Script:
scripts/demoAuction.ts

🧰 Off-Chain Winner Selection (Real fhEVM Model)

fhEVM intentionally does not decrypt on-chain.
Instead:

Fetch encrypted values

Pass ciphertext to FHE Oracle

Oracle decrypts off-chain

Winner computed locally

(Optional) write winner back on-chain

Example:

const bidders = await auction.getBidders();
const encrypted = await auction.getEncryptedBid(bidder);
// decrypted = fheOracle.decrypt(encrypted);

🧭 Future Improvements

Real FHE encryption using @fhevm/sdk

Oracle-based decryption

Public revealWinner() function

Web frontend (React)

Multi-auction support

Time-based auction closing

🔗 Technologies Used

Zama fhEVM

Solidity 0.8.27

Hardhat

ethers.js v6

TypeScript

Node.js 20

👤 Author

Theuvkhan
GitHub: https://github.com/Theuvkhan

