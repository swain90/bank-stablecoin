# Bank Stablecoin Platform - Getting Started

A comprehensive blockchain-based stablecoin platform built with Daml and React.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Daml SDK** (version 2.10.2 or higher)
  - Install from: https://docs.daml.com/getting-started/installation.html
  - Verify: `daml version`

- **Node.js** (version 16.x or higher) and **npm**
  - Install from: https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- **A modern web browser** (Chrome, Firefox, or Edge recommended)

---

## 🚀 Quick Start

### 1. Clone or Navigate to the Project Directory

```bash
cd bank-stablecoin
```

### 2. Build the Daml Smart Contracts

```bash
daml build
```

This compiles all Daml modules and creates a DAR (Daml Archive) file.

### 3. Start the Daml Sandbox and Navigator

```bash
daml start
```

This command:
- Starts the Canton sandbox ledger (on port 6865)
- Starts the JSON API server (on port 7575)
- Runs the initialization script (`Init.daml`)
- Opens Daml Navigator in your browser (optional UI)

**Wait for the message**: `"INFO Canton sandbox is ready"`

### 4. Install Frontend Dependencies

In a **new terminal window**, navigate to the UI directory:

```bash
cd ui
npm install
```

This installs all React dependencies.

### 5. Generate TypeScript Types from Daml

```bash
npm run codegen
```

Or manually:
```bash
daml codegen js ../daml/.daml/dist/bank-stablecoin-1.0.0.dar -o src/daml.js
```

This generates TypeScript bindings for your Daml contracts.

### 6. Start the React Development Server

```bash
npm start
```

The application will open automatically at: `http://localhost:3000`

---

## 👥 Default Users

The initialization script creates three parties:

| Party | Role | Party ID |
|-------|------|----------|
| **Bank** | Issuer | Bank::1220... |
| **Alice** | User | Alice::1220... |
| **Bob** | User | Bob::1220... |

### Initial Balances:
- **Alice**: $1,500 USD, €800 EUR
- **Bob**: $2,000 USD, €1,500 EUR

---

## 🔑 Logging In

1. Open `http://localhost:3000`
2. Select a party from the dropdown:
   - **Bank** - Access admin features
   - **Alice** - Regular user
   - **Bob** - Regular user
3. Click **"Login"**

**Note**: Party IDs change each time you restart the sandbox. The UI automatically shows friendly names.

---

## 🛠️ Common Commands

### Restart Everything

```bash
# Terminal 1: Stop Daml (Ctrl+C), then:
daml clean
daml build
daml start

# Terminal 2: Stop React (Ctrl+C), then:
npm start
```

### View Party IDs

```bash
daml ledger list-parties --host localhost --port 6865
```

### Update Party IDs in Code

If you need to update party IDs in `ui/src/config/parties.ts`, get the current IDs:

```bash
daml ledger list-parties --host localhost --port 6865
```

Then update the `partyId` fields in `parties.ts`.

### Rebuild After Daml Changes

```bash
# Terminal 1
daml build

# Terminal 2
cd ui
npm run codegen
```

Restart the React dev server if needed.

---

## 🌐 Deploy to the Web (Recommended)

For a portfolio-ready demo, host the React UI as a static site and run the Daml backend on a small VM/container service.

### Backend (Daml + JSON API + CORS proxy)

1. Provision a small server (Fly.io, Render, Railway, or a VPS).
2. Install the Daml SDK (2.10.2+) and Node.js.
3. On the server, run:
```bash
bash start-backend.sh
```

Expose port `7576` publicly. The UI only talks to the proxy port.

### Frontend (Vercel/Netlify)

Set build-time environment variables (see `ui/.env.production.example`):

- `REACT_APP_HTTP_BASE_URL=https://YOUR_BACKEND_DOMAIN`
- `REACT_APP_WS_BASE_URL=wss://YOUR_BACKEND_DOMAIN`

Then build and deploy:
```bash
cd ui
npm run build
```

Upload the `ui/build` output to your static host.

**Note:** The Daml sandbox is in-memory, which is fine for demos/portfolios but not production.

---

## 📁 Project Structure

```
bank-stablecoin/
├── daml/                      # Daml smart contracts
│   ├── Model/
│   │   ├── Stablecoin.daml   # Core stablecoin logic
│   │   ├── Compliance.daml   # Freeze/unfreeze accounts
│   │   ├── Loan.daml         # Lending & interest
│   │   ├── AtomicSwap.daml   # Currency swaps
│   │   ├── MultiSig.daml     # Multi-signature wallets
│   │   └── Account.daml      # KYC and accounts
│   ├── Init.daml             # Initialization script
│   └── daml.yaml             # Daml project config
├── ui/                        # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── config/           # Configuration
│   │   └── App.tsx           # Main app
│   ├── daml.js/              # Generated TypeScript types
│   └── package.json
└── README.md
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'daml.js'"

**Solution**: Run code generation:
```bash
cd ui
npm run codegen
```

### Issue: "Port 6865 already in use"

**Solution**: Kill existing Daml processes:
```bash
pkill -f daml
# Then restart: daml start
```

### Issue: "Contract not found" errors

**Solution**: Restart the sandbox (this resets all data):
```bash
daml clean
daml start
```

### Issue: Party IDs not matching

**Solution**: Party IDs change on each sandbox restart. Update `ui/src/config/parties.ts` with new IDs or use the dropdown in the UI.

### Issue: React app won't start

**Solution**: Clear cache and reinstall:
```bash
cd ui
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 🔄 Development Workflow

1. **Make changes to Daml contracts** in `daml/` directory
2. **Rebuild**: `daml build`
3. **Restart sandbox**: `daml start` (in separate terminal)
4. **Regenerate types**: `cd ui && npm run codegen`
5. **React auto-reloads** with changes in `ui/src/`

---

## 📚 Additional Resources

- **Daml Documentation**: https://docs.daml.com
- **Daml Cheat Sheet**: https://docs.daml.com/cheat-sheet/
- **React Documentation**: https://react.dev
- **Material-UI**: https://mui.com
- **Semantic UI React**: https://react.semantic-ui.com

---

## 🎯 Next Steps

Once the application is running:
1. Check out the [Features Documentation](./README-FEATURES.md)
2. Try creating transfers between Alice and Bob
3. Explore the multi-signature wallet feature
4. Test loan creation and repayment

---

## 💡 Tips

- **Keep both terminals open** (one for Daml, one for React)
- **Navigator**: Access Daml Navigator at `http://localhost:7500` for contract inspection
- **Hot Reload**: React auto-reloads on code changes
- **Logs**: Check terminal output for errors and debug info

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Daml documentation at https://docs.daml.com
- Inspect contracts in Daml Navigator

---

Happy coding! 🚀
