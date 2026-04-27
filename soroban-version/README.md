# SecureCam — Decentralized CCTV Access Control

A decentralized application (dApp) built on **Stellar Testnet** using **Soroban** smart contracts to manage access to CCTV footage metadata.

## Features
- **Role-Based Access Control:** Hardcoded admin can whitelist/revoke viewer addresses.
- **Inter-Contract Verification:** `cctv_vault` calls `access_registry` to verify users.
- **Token Gating:** $VAULT asset (SAC) required to register new footage.
- **Real-Time Transaction Status:** Granular feedback (Pending -> Submitted -> Confirmed).
- **Premium UI:** Glassmorphic design with dark mode and micro-animations.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide-React.
- **Blockchain:** Stellar SDK, Freighter Wallet API.
- **Contracts:** Rust, Soroban SDK.
- **CI/CD:** GitHub Actions.

## Setup & Deployment

### Contracts
1. Build `access_registry`: `cargo build --target wasm32-unknown-unknown --release`
2. Build `cctv_vault` (ensure `access_registry.wasm` is available in target).
3. Deploy to Testnet: `soroban contract deploy --wasm ... --network testnet --source ADMIN`

### Frontend
1. `cd frontend`
2. `npm install`
3. Update `src/constants.ts` with deployed contract IDs.
4. `npm run dev`

---
*Built for the Stellar Hackathon Level 4 Production Requirement.*
