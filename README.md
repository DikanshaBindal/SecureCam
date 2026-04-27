# SecureCam — Level 3 Integrity dApp

A simple yet powerful dApp to ensure CCTV footage integrity using the Stellar Blockchain.

## Features
- **Hashing:** Generates SHA-256 hashes of any uploaded footage.
- **Blockchain Storage:** Mocks the process of committing hashes to Stellar Testnet (via Memo).
- **Verification:** Compare re-uploaded files against previous records.
- **Local Cache:** Stores recent activity in `localStorage`.
- **Premium UI:** Custom Glassmorphism CSS with Vanilla JavaScript.

## Setup
1. Open `index.html` in any modern web browser.
2. Select a file to generate its cryptographic signature.
3. Click "Commit to Blockchain" to store the record.
4. Use the "Verify" section to re-upload the same (or tampered) file.

## Testing
Open the browser console and run:
```javascript
runSecureTests()
```

## Tech Stack
- HTML5 / CSS3 / Vanilla JavaScript
- Lucide Icons
- Stellar SDK (Client-side)
