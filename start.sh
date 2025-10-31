#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill DAML processes
    if [ ! -z "$DAML_PID" ]; then
        kill $DAML_PID 2>/dev/null
    fi
    pkill -f "daml start" 2>/dev/null
    
    # Kill CORS proxy
    if [ ! -z "$PROXY_PID" ]; then
        kill $PROXY_PID 2>/dev/null
    fi
    pkill -f "cors-proxy.js" 2>/dev/null
    
    # Kill UI process
    if [ ! -z "$UI_PID" ]; then
        kill $UI_PID 2>/dev/null
    fi
    pkill -f "react-scripts start" 2>/dev/null
    pkill -f "craco start" 2>/dev/null
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Bank Stablecoin Platform Startup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Check prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

# Check if daml is installed
if ! command -v daml &> /dev/null; then
    echo -e "${RED}Error: daml is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://docs.daml.com/getting-started/installation.html${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo -e "${YELLOW}Install Node.js from: https://nodejs.org/${NC}"
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: node is not installed${NC}"
    echo -e "${YELLOW}Install Node.js from: https://nodejs.org/${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "daml" ] || [ ! -d "ui" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# Check if cors-proxy.js exists
if [ ! -f "cors-proxy.js" ]; then
    echo -e "${RED}Error: cors-proxy.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}\n"

# Step 2: Clean previous builds
echo -e "${BLUE}[2/7] Cleaning previous builds...${NC}"
cd daml
daml clean
rm -rf .daml/canton
cd ..
echo -e "${GREEN}✓ Clean completed${NC}\n"

# Step 3: Build DAML contracts
echo -e "${BLUE}[3/7] Building DAML contracts...${NC}"
cd daml
if ! daml build; then
    echo -e "${RED}Failed to build DAML contracts. Exiting.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ DAML contracts built successfully${NC}\n"

# Step 4: Generate JavaScript bindings
echo -e "${BLUE}[4/7] Generating JavaScript bindings...${NC}"
cd daml
if ! daml codegen js .daml/dist/bank-stablecoin-1.0.0.dar -o ../ui/src/daml.js; then
    echo -e "${RED}Failed to generate JavaScript bindings. Exiting.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ JavaScript bindings generated${NC}\n"

# Step 5: Start DAML ledger
echo -e "${BLUE}[5/7] Starting DAML ledger...${NC}"
cd daml
daml start > daml.log 2>&1 &
DAML_PID=$!
cd ..

# Wait for DAML to be ready
echo -e "${YELLOW}Waiting for DAML ledger to start...${NC}"
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:7575/v1/user/allocate > /dev/null 2>&1; then
        echo -e "${GREEN}✓ DAML ledger is ready${NC}\n"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}DAML ledger failed to start within 60 seconds${NC}"
        echo -e "${YELLOW}Check daml/daml.log for errors${NC}"
        exit 1
    fi
    
    echo -ne "${YELLOW}Attempt $attempt/$max_attempts...\r${NC}"
    sleep 1
done

# Step 5.5: Update party IDs in parties.ts
echo -e "${BLUE}[5.5/7] Updating party IDs...${NC}"

# Wait a moment for init script to complete
sleep 5

# Get party IDs from the ledger
PARTIES=$(cd daml && daml ledger list-parties --host localhost --port 6865 2>&1)

# Debug: Show raw output
echo "Debug - Raw party list output:"
echo "$PARTIES"
echo ""

# Extract party IDs for Alice, Bob, and Bank (using sed for better reliability)
ALICE_ID=$(echo "$PARTIES" | grep -i "alice" | sed -n "s/.*party = '\([^']*\)'.*/\1/p")
BOB_ID=$(echo "$PARTIES" | grep -i "bob" | sed -n "s/.*party = '\([^']*\)'.*/\1/p")
BANK_ID=$(echo "$PARTIES" | grep -i "bank" | sed -n "s/.*party = '\([^']*\)'.*/\1/p")

# Debug: Show what we found
echo "Debug - Extracted party IDs:"
echo "  Alice: ${ALICE_ID}"
echo "  Bob:   ${BOB_ID}"
echo "  Bank:  ${BANK_ID}"
echo ""

if [ -z "$ALICE_ID" ] || [ -z "$BOB_ID" ] || [ -z "$BANK_ID" ]; then
    echo -e "${RED}❌ Failed to extract party IDs${NC}"
    echo -e "${YELLOW}You'll need to update ui/src/config/parties.ts manually${NC}"
    echo -e "${YELLOW}Run this command to see the party IDs:${NC}"
    echo -e "${YELLOW}  cd daml && daml ledger list-parties --host localhost --port 6865${NC}\n"
else
    # Update parties.ts with current party IDs
    cat > ui/src/config/parties.ts << EOF
// Party configuration
// Auto-generated by start.sh - DO NOT EDIT MANUALLY
// Last updated: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

export interface PartyInfo {
  displayName: string;
  partyId: string;
  role: string;
}

export const parties: Record<string, PartyInfo> = {
  alice: {
    displayName: 'Alice',
    partyId: '${ALICE_ID}',
    role: 'User'
  },
  bob: {
    displayName: 'Bob',
    partyId: '${BOB_ID}',
    role: 'User'
  },
  bank: {
    displayName: 'Bank',
    partyId: '${BANK_ID}',
    role: 'Issuer'
  }
};

export const getAllParties = (): PartyInfo[] => {
  return Object.values(parties);
};

export const getPartyByName = (name: string): PartyInfo | undefined => {
  return parties[name.toLowerCase()];
};

export const getDisplayName = (partyId: string): string => {
  const party = Object.values(parties).find(p => p.partyId === partyId);
  return party?.displayName || partyId.split('::')[0] || partyId;
};

EOF

    echo -e "${GREEN}✓ Party IDs updated successfully${NC}"
    echo -e "  Alice: ${ALICE_ID}"
    echo -e "  Bob:   ${BOB_ID}"
    echo -e "  Bank:  ${BANK_ID}\n"
fi

# Wait for DAML to be ready
echo -e "${YELLOW}Waiting for DAML ledger to start...${NC}"
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:7575/v1/user/allocate > /dev/null 2>&1; then
        echo -e "${GREEN}✓ DAML ledger is ready${NC}\n"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}DAML ledger failed to start within 60 seconds${NC}"
        echo -e "${YELLOW}Check daml/daml.log for errors${NC}"
        exit 1
    fi
    
    echo -ne "${YELLOW}Attempt $attempt/$max_attempts...\r${NC}"
    sleep 1
done

# Step 6: Start CORS Proxy
echo -e "${BLUE}[6/7] Starting CORS proxy server...${NC}"
node cors-proxy.js > cors-proxy.log 2>&1 &
PROXY_PID=$!

# Wait for CORS proxy to be ready
echo -e "${YELLOW}Waiting for CORS proxy to start...${NC}"
sleep 3
if curl -s http://localhost:7576 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CORS proxy is ready${NC}\n"
else
    echo -e "${YELLOW}⚠ CORS proxy may not be ready yet, continuing...${NC}\n"
fi

# Step 7: Start React UI
echo -e "${BLUE}[7/7] Starting React UI...${NC}"

# Check if node_modules exists, if not run npm install
if [ ! -d "ui/node_modules" ]; then
    echo -e "${YELLOW}node_modules not found, running npm install...${NC}"
    cd ui
    npm install --legacy-peer-deps
    cd ..
fi

cd ui
npm start > ui.log 2>&1 &
UI_PID=$!
cd ..

# Wait for UI to be ready
echo -e "${YELLOW}Waiting for React UI to start...${NC}"
sleep 5

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Available Services:${NC}"
echo -e "  DAML Navigator:  ${GREEN}http://localhost:7500${NC}"
echo -e "  DAML JSON API:   ${GREEN}http://localhost:7575${NC}"
echo -e "  CORS Proxy:      ${GREEN}http://localhost:7576${NC}"
echo -e "  React UI:        ${GREEN}http://localhost:3001${NC}"

echo -e "\n${BLUE}Logs:${NC}"
echo -e "  DAML:            ${YELLOW}daml/daml.log${NC}"
echo -e "  CORS Proxy:      ${YELLOW}cors-proxy.log${NC}"
echo -e "  React UI:        ${YELLOW}ui/ui.log${NC}"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and wait for interrupt
wait