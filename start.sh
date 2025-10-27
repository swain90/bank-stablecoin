#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Bank Stablecoin Platform Startup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    pkill -f "daml start"
    pkill -f "cors-proxy.js"
    pkill -f "react-scripts start"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Clean previous build
echo -e "${BLUE}[1/8] Cleaning previous build...${NC}"
daml clean
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to clean. Exiting.${NC}"
    exit 1
fi

# Step 2: Build Daml contracts
echo -e "${BLUE}[2/8] Building Daml contracts...${NC}"
daml build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build Daml contracts. Exiting.${NC}"
    exit 1
fi

# Step 3: Start Daml sandbox in background
echo -e "${BLUE}[3/8] Starting Daml sandbox...${NC}"
daml start &
DAML_PID=$!

# Wait for sandbox to be ready
echo -e "${YELLOW}Waiting for Canton sandbox to be ready...${NC}"
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:7575/v1/query > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Daml sandbox is ready!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}Timeout waiting for Daml sandbox. Exiting.${NC}"
        cleanup
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""

# Step 4: Wait a bit more for initialization script to complete
sleep 5

# Step 5: Fetch and update party IDs
echo -e "${BLUE}[4/8] Fetching party IDs and updating configuration...${NC}"
node update-parties.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update party IDs. Exiting.${NC}"
    cleanup
    exit 1
fi

# Step 6: Start CORS proxy in background
echo -e "${BLUE}[5/8] Starting CORS proxy...${NC}"
node cors-proxy.js &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 3
if curl -s http://localhost:7576/v1/query > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CORS proxy is ready!${NC}"
else
    echo -e "${YELLOW}Warning: CORS proxy may not be ready yet${NC}"
fi

# Step 6.5: Generate TypeScript bindings
echo -e "${BLUE}[6/8] Generating TypeScript bindings...${NC}"
cd ui
npm run codegen
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate TypeScript bindings. Exiting.${NC}"
    cd ..
    cleanup
    exit 1
fi
echo -e "${GREEN}✓ TypeScript bindings generated!${NC}"
cd ..

# Step 7: Start React UI
echo -e "${BLUE}[7/8] Starting React UI...${NC}"
cd ui
npm start &
UI_PID=$!

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Services running:${NC}"
echo -e "  • Daml Sandbox: http://localhost:6865"
echo -e "  • JSON API: http://localhost:7575"
echo -e "  • CORS Proxy: http://localhost:7576"
echo -e "  • React UI: http://localhost:3001"
echo -e "  • Navigator: http://localhost:7500"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for all background processes
wait