# 🛡️ CivicGuard - Zero-Knowledge Document Verification

**Privacy-first document verification using cryptographic proofs. Store only hashes, never document content.**

---

## 🚀 Quick Start

### Automated Setup (Recommended)

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```powershell
.\setup.ps1
```

### Manual Setup

See [QUICK_START.md](./QUICK_START.md) for step-by-step instructions.

---

## 📁 Project Structure

```
CivicGuardApp/
├── backend/          # Node.js API Server
├── mobile/           # React Native Mobile App
├── hardhat/          # Smart Contracts
├── setup.sh          # Automated setup (Mac/Linux)
├── setup.ps1         # Automated setup (Windows)
├── SETUP_INSTRUCTIONS.md  # Detailed setup guide
└── QUICK_START.md    # Quick start guide
```

---

## ✨ Features

- ✅ **Zero-Knowledge Storage**: Only document hashes stored, never content
- ✅ **Self-Sovereign Identity**: Users control their identity with DIDs
- ✅ **W3C Verifiable Credentials**: Standard-compliant credentials
- ✅ **Biometric Authentication**: Fingerprint/Face ID required for approvals
- ✅ **QR Code Verification**: Easy verification flow
- ✅ **Offline Support**: Works offline, syncs when online
- ✅ **Blockchain-Backed**: Issuer registry on Polygon Mumbai

---

## 🎯 Demo Flow

1. **User Onboarding**: Google OAuth → Create Wallet → Save Seed Phrase
2. **Credential Import**: DigiLocker integration (or demo endpoint)
3. **Verification**: Verifier generates QR → Holder scans → Approves → Results

---

## 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Get running in 10 minutes
- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Detailed setup guide
- [DEMO_SETUP.md](./DEMO_SETUP.md) - Demo presentation guide

---

## 🔧 Tech Stack

**Backend:**
- Node.js + Express
- Prisma + SQLite
- Socket.io (WebSocket)
- W3C Verifiable Credentials
- Ethers.js (Blockchain)

**Mobile:**
- React Native + Expo
- Zustand (State Management)
- SQLite (Local Storage)
- Expo SecureStore (Key Storage)
- Biometric Authentication

**Blockchain:**
- Polygon Mumbai (Testnet)
- Hardhat (Smart Contracts)
- Solidity

---

## 🎬 For Judges

**Key Innovation:**
- Zero-knowledge document verification
- Only hashes stored, never document content
- Cryptographic proofs for verification
- Privacy-first architecture

**Demo Ready:**
- ✅ All core features implemented
- ✅ Demo endpoint for testing
- ✅ Complete verification flow
- ✅ Production-ready code

---

## 📝 License

MIT License - Free to use for hackathon

---

## 🙏 Acknowledgments

Built for hackathon with zero-cost services:
- Polygon Mumbai (Free testnet)
- SQLite (Free database)
- Expo (Free mobile development)
- All open-source libraries

---

**Ready to demo! 🚀**

