🔐 Private Sealed-Bid Auction (fhEVM • Fully Homomorphic Encryption)

A privacy-preserving auction system built using Zama’s fhEVM.
All bids are encrypted on-chain, meaning:

No one (not even the contract owner) can see individual bid values.

Bids remain fully confidential.

Winner computation happens off-chain using FHE decryption helpers.

Only the final revealed winner is ever exposed (optional).

This project is an end-to-end demonstration for the Zama Builder Track.

🚀 Features
✔ Encrypted bid submission

Users submit an euint64 encrypted value.
Smart contract stores the ciphertext directly.

✔ No on-chain decryption

fhEVM no longer allows synchronous decryption on-chain.
All decryption is done off-chain, exactly as intended in modern FHEVM.

✔ Owner-controlled auction closing

Once closed, no more bids can be placed.

✔ Export bidders + encrypted bids

The contract exposes view functions so an off-chain script can:

Fetch all encrypted bids

Decrypt them using the FHEVM oracle

Determine the winner

(Optional) Call a public revealWinner(...) method

🧱 Contract Overview

Located at:
contracts/PrivateAuction.sol

Implements:

placeBid(euint64 bid)

closeAuction()

getEncryptedBid(address bidder)

getBidders()

🧪 Testing

Run:
npx hardhat test

Tests include:

Deploying the auction

Submitting simulated encrypted bids

Closing auction

Verifying bidder list integrity


The test file is located at:
test/PrivateAuction.test.ts

🧰 Off-Chain Winner Selection (FHE Decryption)

The FHEVM development model requires an off-chain step to decrypt.
Typical workflow:

Fetch encrypted bids via Hardhat script:

const bidders = await auction.getBidders();
const encrypted = await auction.getEncryptedBid(bidder);


Use fhEVM’s decrypt utilities (FHE Oracle)

Compute the highest bid locally

(Optional) Call a function like revealWinner(address,uint256)

This architecture follows Zama’s official async-decryption model.

📁 Project Structure
contracts/
 └── PrivateAuction.sol
test/
 └── PrivateAuction.test.ts
scripts/
README.md

🏆 Why This Project Fits the Builder Track
Realistic privacy use-case

---

## 🔁 End-to-end demo script

To see the full flow in one command (deploy → bid → close → decrypt → pick winner), run:

```bash
npx hardhat run scripts/demoAuction.ts

End-to-end working code

Tests included

Off-chain cryptographic workflow

Clean architecture following fhEVM best practices



MADE WITH ❤️ FOR ZAMA BY THEUVKHAN
