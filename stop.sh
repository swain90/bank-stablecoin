#!/bin/bash

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping all Bank Stablecoin services...${NC}\n"

# Stop Daml processes
echo "Stopping Daml sandbox..."
pkill -f "daml start"
pkill -f "canton"

# Stop CORS proxy
echo "Stopping CORS proxy..."
pkill -f "cors-proxy.js"

# Stop React dev server
echo "Stopping React UI..."
pkill -f "react-scripts start"
pkill -f "craco"

# Give processes time to terminate
sleep 2

echo -e "\n${GREEN}All services stopped.${NC}"